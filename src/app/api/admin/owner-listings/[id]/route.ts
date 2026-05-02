import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

const TRANS_MAP: Record<string, string> = { AT: "AT", MT: "MT", PDK: "PDK", Автомат: "AT", Механика: "MT" };
const FUEL_MAP: Record<string, string> = {
  petrol: "petrol", diesel: "diesel", electric: "electric", hybrid: "hybrid",
  Бензин: "petrol", Дизель: "diesel", Электро: "electric", Гибрид: "hybrid",
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  const { id } = await params;
  const listing = await prisma.ownerListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { action, rejectReason } = body as { action: string; rejectReason?: string };

  if (!["approve", "reject", "suspend"].includes(action)) {
    return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
  }

  if (action === "approve") {
    const [vehicleClass, transmission, fuelType] = await Promise.all([
      prisma.vehicleClass.findFirst({ where: { name: { equals: listing.vehicleClass, mode: "insensitive" } } }),
      prisma.transmission.findFirst({ where: { name: { equals: TRANS_MAP[listing.transmission] ?? listing.transmission, mode: "insensitive" } } }),
      prisma.fuelType.findFirst({ where: { name: { equals: FUEL_MAP[listing.fuelType] ?? listing.fuelType, mode: "insensitive" } } }),
    ]);

    if (!vehicleClass || !transmission || !fuelType) {
      return NextResponse.json(
        { error: `Не найдены справочники: ${!vehicleClass ? "класс" : ""} ${!transmission ? "КПП" : ""} ${!fuelType ? "топливо" : ""}`.trim() },
        { status: 422 }
      );
    }

    const pricePerMinCents = Math.round(Number(listing.pricePerMinute) * 100);
    const minChargeCents = Math.round(Number(listing.minCharge) * 100);

    const result = await prisma.$transaction(async (tx) => {
      const tariff = await tx.tariff.create({
        data: {
          name: `owner-${listing.plateNumber}-${Date.now()}`,
          pricePerMinCents,
          minChargeCents,
          isActive: true,
        },
      });

      const vehicle = await tx.vehicle.create({
        data: {
          brand: listing.make,
          model: listing.model,
          plateNumber: listing.plateNumber,
          year: listing.year,
          classId: vehicleClass.id,
          transmissionId: transmission.id,
          fuelTypeId: fuelType.id,
          baseTariffId: tariff.id,
          photoUrl: listing.photoUrls[0] ?? null,
          status: "available",
        },
      });

      if (listing.latitude && listing.longitude) {
        await tx.vehicleLastState.create({
          data: {
            vehicleId: vehicle.id,
            lat: listing.latitude,
            lon: listing.longitude,
          },
        });
      }

      const updated = await tx.ownerListing.update({
        where: { id },
        data: { status: "APPROVED", vehicleId: vehicle.id },
      });

      return { listing: updated, vehicleId: vehicle.id };
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "approve_owner_listing",
      entityType: "owner_listing",
      entityId: listing.id,
      meta: { vehicleId: result.vehicleId, plateNumber: listing.plateNumber },
    });

    return NextResponse.json({
      ...result.listing,
      pricePerMinute: Number(result.listing.pricePerMinute),
      minCharge: Number(result.listing.minCharge),
    });
  }

  if (action === "reject") {
    if (!rejectReason?.trim()) {
      return NextResponse.json({ error: "Укажите причину отказа" }, { status: 400 });
    }
    const updated = await prisma.ownerListing.update({
      where: { id },
      data: { status: "REJECTED", rejectReason },
    });
    await logAudit({
      actorUserId: payload.userId,
      action: "reject_owner_listing",
      entityType: "owner_listing",
      entityId: listing.id,
      meta: { reason: rejectReason },
    });
    return NextResponse.json({ ...updated, pricePerMinute: Number(updated.pricePerMinute), minCharge: Number(updated.minCharge) });
  }

  // suspend
  const updated = await prisma.ownerListing.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  if (listing.vehicleId) {
    await prisma.vehicle.update({ where: { id: listing.vehicleId }, data: { status: "blocked" } });
  }
  await logAudit({
    actorUserId: payload.userId,
    action: "suspend_owner_listing",
    entityType: "owner_listing",
    entityId: listing.id,
    meta: {},
  });
  return NextResponse.json({ ...updated, pricePerMinute: Number(updated.pricePerMinute), minCharge: Number(updated.minCharge) });
}
