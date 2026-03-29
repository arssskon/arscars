import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function GET(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await prisma.trip.findMany({
    where: { userId: payload.userId },
    orderBy: { startedAt: "desc" },
    include: { vehicle: true },
  });

  return NextResponse.json(
    trips.map((t) => ({
      id: t.id,
      status: t.status,
      startedAt: t.startedAt,
      finishedAt: t.finishedAt,
      durationMinutes: t.durationMinutes,
      amountCents: t.amountCents,
      vehicle: {
        id: t.vehicle.id,
        brand: t.vehicle.brand,
        model: t.vehicle.model,
        photoUrl: t.vehicle.photoUrl,
      },
    }))
  );
}
