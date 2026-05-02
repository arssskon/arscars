import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.ownerListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  if (listing.userId !== payload.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (listing.status !== "PENDING" && listing.status !== "REJECTED") {
    return NextResponse.json({ error: "Редактирование недоступно" }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    make, model, year, plateNumber, color, photoUrls,
    pricePerMinute, minCharge, vehicleClass, transmission,
    fuelType, ownerPhone, address, description,
    latitude, longitude, availableFrom, availableTo,
  } = body;

  const updated = await prisma.ownerListing.update({
    where: { id },
    data: {
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: Number(year) }),
      ...(plateNumber && { plateNumber }),
      ...(color && { color }),
      ...(description !== undefined && { description: description || null }),
      ...(photoUrls && { photoUrls }),
      ...(pricePerMinute && { pricePerMinute }),
      ...(minCharge && { minCharge }),
      ...(vehicleClass && { vehicleClass }),
      ...(transmission && { transmission }),
      ...(fuelType && { fuelType }),
      ...(ownerPhone && { ownerPhone }),
      ...(address && { address }),
      ...(latitude !== undefined && { latitude: latitude ? Number(latitude) : null }),
      ...(longitude !== undefined && { longitude: longitude ? Number(longitude) : null }),
      ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
      ...(availableTo !== undefined && { availableTo: availableTo ? new Date(availableTo) : null }),
      status: "PENDING",
      rejectReason: null,
    },
  });

  return NextResponse.json({
    ...updated,
    pricePerMinute: Number(updated.pricePerMinute),
    minCharge: Number(updated.minCharge),
    latitude: updated.latitude ? Number(updated.latitude) : null,
    longitude: updated.longitude ? Number(updated.longitude) : null,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.ownerListing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  if (listing.userId !== payload.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.ownerListing.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
