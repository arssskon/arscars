import { NextRequest, NextResponse } from "next/server";
import { getUserPayload } from "@/lib/user-guard";
import { prisma } from "@/lib/prisma";
import { TripPhase } from "@prisma/client";

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

  let body: { phase?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат" }, { status: 400 });
  }

  const { phase } = body;
  if (phase !== TripPhase.START && phase !== TripPhase.END) {
    return NextResponse.json({ error: "phase must be START or END" }, { status: 400 });
  }

  const now = new Date();
  const updateData =
    phase === TripPhase.START
      ? { startPhotosConfirmedAt: now }
      : { endPhotosConfirmedAt: now };

  const updated = await prisma.trip.update({ where: { id: tripId }, data: updateData });
  return NextResponse.json(updated);
}
