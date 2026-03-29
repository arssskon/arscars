import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.userId !== payload.userId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (reservation.status !== "active") {
    return NextResponse.json({ error: "Уже отменено" }, { status: 400 });
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: "canceled", canceledAt: new Date() },
  });

  await prisma.vehicle.update({
    where: { id: reservation.vehicleId },
    data: { status: "available" },
  });

  return NextResponse.json({ ok: true });
}
