import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const endLat: number | undefined = body.endLat;
  const endLon: number | undefined = body.endLon;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { tariff: true },
  });

  if (!trip || trip.userId !== payload.userId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (trip.status !== "active") {
    return NextResponse.json({ error: "Поездка уже завершена" }, { status: 400 });
  }

  const finishedAt = new Date();
  const durationMinutes = Math.max(1, Math.round((finishedAt.getTime() - trip.startedAt.getTime()) / 60000));
  const amountCents = Math.max(trip.tariff.minChargeCents, durationMinutes * trip.tariff.pricePerMinCents);

  const updated = await prisma.trip.update({
    where: { id },
    data: {
      status: "finished",
      finishedAt,
      durationMinutes,
      amountCents,
      ...(endLat != null && endLon != null ? { endLat, endLon } : {}),
    },
  });

  await prisma.vehicle.update({
    where: { id: trip.vehicleId },
    data: { status: "available" },
  });

  if (endLat != null && endLon != null) {
    await prisma.vehicleLastState.upsert({
      where: { vehicleId: trip.vehicleId },
      update: { lat: endLat, lon: endLon },
      create: { vehicleId: trip.vehicleId, lat: endLat, lon: endLon },
    });
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    durationMinutes: updated.durationMinutes,
    amountCents: updated.amountCents,
  });
}
