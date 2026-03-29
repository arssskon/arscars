import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      );
    }

    if (reservation.status !== "active") {
      return NextResponse.json(
        { error: "Можно отменить только активное бронирование" },
        { status: 400 }
      );
    }

    const ops = [
      prisma.reservation.update({
        where: { id },
        data: {
          status: "canceled",
          canceledAt: new Date(),
        },
      }),
      ...(reservation.vehicle.status === "reserved"
        ? [prisma.vehicle.update({ where: { id: reservation.vehicleId }, data: { status: "available" } })]
        : []),
    ];

    await prisma.$transaction(ops);

    await logAudit({
      actorUserId: payload.userId,
      action: "cancel",
      entityType: "reservation",
      entityId: id,
      meta: { code: reservation.code, vehicleId: reservation.vehicleId },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Reservation cancel error:", error);
    return NextResponse.json(
      { error: "Ошибка отмены бронирования" },
      { status: 500 }
    );
  }
}
