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

  try {
    const { id } = await params;
    const { lat, lon } = await req.json();

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json({ error: "lat и lon обязательны" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    const state = await prisma.vehicleLastState.upsert({
      where: { vehicleId: id },
      update: { lat, lon },
      create: { vehicleId: id, lat, lon },
    });

    await logAudit({
      actorUserId: guard.payload.userId,
      action: "set_location",
      entityType: "vehicle",
      entityId: id,
      meta: { lat, lon },
    });

    return NextResponse.json({
      lat: Number(state.lat),
      lon: Number(state.lon),
    });
  } catch (error) {
    console.error("Vehicle location PATCH error:", error);
    return NextResponse.json({ error: "Ошибка обновления координат" }, { status: 500 });
  }
}
