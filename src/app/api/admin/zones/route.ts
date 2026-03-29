import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const zones = await prisma.zone.findMany({
      orderBy: { name: "asc" },
      include: {
        zoneRule: true,
        _count: { select: { vehicles: true } },
      },
    });

    const data = zones.map((z) => ({
      id: z.id,
      name: z.name,
      centerLat: Number(z.centerLat),
      centerLon: Number(z.centerLon),
      radiusM: z.radiusM,
      createdAt: z.createdAt,
      zoneRule: z.zoneRule,
      vehiclesCount: z._count.vehicles,
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Zones GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки зон" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const body = await req.json();
    const {
      name,
      centerLat,
      centerLon,
      radiusM,
      canFinish,
      outOfZoneFeeCents,
      note,
    } = body;

    if (!name || centerLat === undefined || centerLon === undefined || radiusM === undefined) {
      return NextResponse.json(
        { error: "Обязательные поля: name, centerLat, centerLon, radiusM" },
        { status: 400 }
      );
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        centerLat,
        centerLon,
        radiusM,
        zoneRule: {
          create: {
            canFinish: canFinish ?? true,
            outOfZoneFeeCents: outOfZoneFeeCents ?? 0,
            note: note ?? null,
          },
        },
      },
      include: { zoneRule: true },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "create",
      entityType: "zone",
      entityId: zone.id,
      meta: { name: zone.name },
    });

    return NextResponse.json(
      {
        ...zone,
        centerLat: Number(zone.centerLat),
        centerLon: Number(zone.centerLon),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Zones POST error:", error);
    return NextResponse.json(
      { error: "Ошибка создания зоны" },
      { status: 500 }
    );
  }
}
