import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";
import { PhotoAngle, TripPhase } from "@prisma/client";

const REQUIRED_ANGLES: PhotoAngle[] = ["FRONT", "REAR", "LEFT", "RIGHT"];

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

  // Verify all 4 required start photos are uploaded
  const startPhotos = await prisma.tripPhoto.findMany({
    where: { reservationId: id, phase: TripPhase.START },
    select: { angle: true },
  });
  const uploadedAngles = new Set(startPhotos.map((p) => p.angle));
  const missing = REQUIRED_ANGLES.filter((a) => !uploadedAngles.has(a));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Загрузи фото перед стартом", missing },
      { status: 400 }
    );
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

  // Transfer pre-trip photos to the created trip
  await prisma.tripPhoto.updateMany({
    where: { reservationId: id, phase: TripPhase.START },
    data: { tripId: trip.id },
  });

  await prisma.reservation.update({ where: { id }, data: { status: "converted" } });
  await prisma.vehicle.update({ where: { id: reservation.vehicleId }, data: { status: "in_trip" } });

  return NextResponse.json({ tripId: trip.id });
}
