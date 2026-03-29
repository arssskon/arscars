import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { VehicleStatus } from "@prisma/client";

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
    const { status, reason } = body as { status: VehicleStatus; reason?: string };

    const validStatuses: VehicleStatus[] = [
      "available",
      "reserved",
      "in_trip",
      "service",
      "blocked",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Статус должен быть одним из: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    const [updated] = await prisma.$transaction([
      prisma.vehicle.update({
        where: { id },
        data: { status },
      }),
      prisma.vehicleStatusHistory.create({
        data: {
          vehicleId: id,
          prevStatus: existing.status,
          nextStatus: status,
          reason: reason ?? null,
          actorUserId: payload.userId,
        },
      }),
    ]);

    await logAudit({
      actorUserId: payload.userId,
      action: "status_change",
      entityType: "vehicle",
      entityId: id,
      meta: {
        prevStatus: existing.status,
        nextStatus: status,
        reason: reason ?? null,
      },
    });

    return NextResponse.json({
      ...updated,
      rating: updated.rating ? Number(updated.rating) : null,
    });
  } catch (error) {
    console.error("Vehicle status PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка изменения статуса автомобиля" },
      { status: 500 }
    );
  }
}
