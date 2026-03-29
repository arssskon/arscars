import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function POST(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await req.json();
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status !== "available") {
    return NextResponse.json({ error: "Автомобиль недоступен" }, { status: 400 });
  }

  const code = "RSV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const reservation = await prisma.reservation.create({
    data: { userId: payload.userId, vehicleId, code, expiresAt, status: "active" },
  });

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "reserved" } });

  return NextResponse.json(
    { id: reservation.id, code: reservation.code, expiresAt: reservation.expiresAt },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    where: { userId: payload.userId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { include: { baseTariff: true } },
    },
  });

  return NextResponse.json(
    reservations.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      vehicle: {
        id: r.vehicle.id,
        brand: r.vehicle.brand,
        model: r.vehicle.model,
        photoUrl: r.vehicle.photoUrl,
        baseTariff: r.vehicle.baseTariff,
      },
    }))
  );
}
