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

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { vehicle: { include: { baseTariff: true } } },
  });
  if (!reservation || reservation.userId !== payload.userId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (reservation.status !== "active") {
    return NextResponse.json({ error: "Бронирование не активно" }, { status: 400 });
  }
  if (new Date() > reservation.expiresAt) {
    return NextResponse.json({ error: "Бронирование истекло" }, { status: 400 });
  }

  const trip = await prisma.trip.create({
    data: {
      userId: payload.userId,
      vehicleId: reservation.vehicleId,
      reservationId: reservation.id,
      tariffId: reservation.vehicle.baseTariffId,
      status: "active",
    },
  });

  await prisma.reservation.update({ where: { id }, data: { status: "converted" } });
  await prisma.vehicle.update({ where: { id: reservation.vehicleId }, data: { status: "in_trip" } });

  return NextResponse.json({ tripId: trip.id });
}
