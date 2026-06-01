import { NextRequest, NextResponse } from "next/server";
import { getUserPayload } from "@/lib/user-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = payload.roles.includes("admin") || payload.roles.includes("support");
  const ownerListing = trip.vehicleId
    ? await prisma.ownerListing.findFirst({ where: { vehicleId: trip.vehicleId, userId: payload.userId } })
    : null;

  if (!isAdmin && !ownerListing) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат" }, { status: 400 });
  }

  const { note } = body;
  if (!note || note.trim().length < 10) {
    return NextResponse.json({ error: "Опишите повреждение (минимум 10 символов)" }, { status: 400 });
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { damageClaimedAt: new Date(), damageNote: note.trim() },
  });

  await prisma.incident.create({
    data: {
      type: "damage",
      status: "new",
      userId: payload.userId,
      vehicleId: trip.vehicleId,
      tripId: trip.id,
      description: note.trim(),
    },
  });

  return NextResponse.json(updated);
}
