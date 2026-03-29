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
    const body = await req.json().catch(() => ({}));
    const { reason } = body as { reason?: string };

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { tariff: true, vehicle: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Поездка не найдена" }, { status: 404 });
    }

    if (trip.status !== "active") {
      return NextResponse.json(
        { error: "Можно принудительно завершить только активную поездку" },
        { status: 400 }
      );
    }

    const finishedAt = new Date();
    const durationMinutes = Math.ceil(
      (finishedAt.getTime() - trip.startedAt.getTime()) / 60_000
    );
    const amountCents = Math.max(
      trip.tariff.minChargeCents,
      durationMinutes * trip.tariff.pricePerMinCents
    );

    await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: {
          status: "forced_finished",
          finishedAt,
          durationMinutes,
          amountCents,
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "available" },
      }),
      prisma.vehicleStatusHistory.create({
        data: {
          vehicleId: trip.vehicleId,
          prevStatus: trip.vehicle.status,
          nextStatus: "available",
          reason: reason ?? "Принудительное завершение поездки администратором",
          actorUserId: payload.userId,
        },
      }),
    ]);

    await logAudit({
      actorUserId: payload.userId,
      action: "force_finish",
      entityType: "trip",
      entityId: id,
      meta: {
        durationMinutes,
        amountCents,
        reason: reason ?? null,
        vehicleId: trip.vehicleId,
      },
    });

    return NextResponse.json({
      success: true,
      id,
      durationMinutes,
      amountCents,
      finishedAt,
    });
  } catch (error) {
    console.error("Trip force-finish error:", error);
    return NextResponse.json(
      { error: "Ошибка принудительного завершения поездки" },
      { status: 500 }
    );
  }
}
