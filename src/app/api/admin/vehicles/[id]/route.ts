import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        vehicleClass: true,
        transmission: true,
        fuelType: true,
        baseTariff: true,
        defaultZone: { include: { zoneRule: true } },
        lastState: true,
        statusHistory: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            actorUser: { select: { id: true, fullName: true, email: true } },
          },
        },
        trips: {
          take: 20,
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            durationMinutes: true,
            amountCents: true,
            user: { select: { id: true, fullName: true } },
          },
        },
        reservations: {
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    return NextResponse.json({
      ...vehicle,
      rating: vehicle.rating ? Number(vehicle.rating) : null,
      lastState: vehicle.lastState
        ? {
            ...vehicle.lastState,
            lat: Number(vehicle.lastState.lat),
            lon: Number(vehicle.lastState.lon),
          }
        : null,
      statusHistory: vehicle.statusHistory.map((h) => ({
        ...h,
        id: h.id.toString(),
      })),
    });
  } catch (error) {
    console.error("Vehicle GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки автомобиля" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

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
      rating,
    } = body;

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(plateNumber !== undefined && { plateNumber }),
        ...(year !== undefined && { year }),
        ...(classId !== undefined && { classId }),
        ...(transmissionId !== undefined && { transmissionId }),
        ...(fuelTypeId !== undefined && { fuelTypeId }),
        ...(baseTariffId !== undefined && { baseTariffId }),
        ...(defaultZoneId !== undefined && { defaultZoneId }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(rating !== undefined && { rating }),
      },
      include: {
        vehicleClass: true,
        transmission: true,
        fuelType: true,
        baseTariff: true,
        defaultZone: true,
        lastState: true,
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "update",
      entityType: "vehicle",
      entityId: id,
      meta: { fields: Object.keys(body) },
    });

    return NextResponse.json({
      ...updated,
      rating: updated.rating ? Number(updated.rating) : null,
      lastState: updated.lastState
        ? {
            ...updated.lastState,
            lat: Number(updated.lastState.lat),
            lon: Number(updated.lastState.lon),
          }
        : null,
    });
  } catch (error) {
    console.error("Vehicle PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления автомобиля" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const { id } = await params;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    if (existing.status !== "blocked") {
      return NextResponse.json(
        { error: "Можно удалить только заблокированный автомобиль" },
        { status: 400 }
      );
    }

    // Soft delete: keep status as blocked (already blocked)
    await logAudit({
      actorUserId: payload.userId,
      action: "delete",
      entityType: "vehicle",
      entityId: id,
      meta: { plateNumber: existing.plateNumber },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Vehicle DELETE error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления автомобиля" },
      { status: 500 }
    );
  }
}
