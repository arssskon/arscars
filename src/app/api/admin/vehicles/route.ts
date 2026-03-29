import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { VehicleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") as VehicleStatus | null;
    const classId = searchParams.get("classId");
    const tariffId = searchParams.get("tariffId");
    const zoneId = searchParams.get("zoneId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { model: { contains: search, mode: "insensitive" } },
        { plateNumber: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (classId) where.classId = parseInt(classId, 10);
    if (tariffId) where.baseTariffId = tariffId;
    if (zoneId) where.defaultZoneId = zoneId;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicleClass: true,
          transmission: true,
          fuelType: true,
          baseTariff: true,
          defaultZone: true,
          lastState: true,
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    const data = vehicles.map((v) => ({
      ...v,
      rating: v.rating ? Number(v.rating) : null,
      lastState: v.lastState
        ? {
            ...v.lastState,
            lat: Number(v.lastState.lat),
            lon: Number(v.lastState.lon),
          }
        : null,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Vehicles GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки автомобилей" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const body = await req.json();
    const {
      brand,
      model,
      plateNumber,
      year,
      classId,
      transmissionId,
      fuelTypeId,
      baseTariffId,
      defaultZoneId,
      photoUrl,
    } = body;

    if (!model || !plateNumber || !classId || !transmissionId || !fuelTypeId || !baseTariffId) {
      return NextResponse.json(
        { error: "Обязательные поля: model, plateNumber, classId, transmissionId, fuelTypeId, baseTariffId" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        brand: brand ?? "Porsche",
        model,
        plateNumber,
        year: year ?? null,
        classId,
        transmissionId,
        fuelTypeId,
        baseTariffId,
        defaultZoneId: defaultZoneId ?? null,
        photoUrl: photoUrl ?? null,
        status: "available",
      },
      include: {
        vehicleClass: true,
        transmission: true,
        fuelType: true,
        baseTariff: true,
        defaultZone: true,
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "create",
      entityType: "vehicle",
      entityId: vehicle.id,
      meta: { plateNumber: vehicle.plateNumber, model: vehicle.model },
    });

    return NextResponse.json(
      { ...vehicle, rating: vehicle.rating ? Number(vehicle.rating) : null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vehicles POST error:", error);
    return NextResponse.json(
      { error: "Ошибка создания автомобиля" },
      { status: 500 }
    );
  }
}
