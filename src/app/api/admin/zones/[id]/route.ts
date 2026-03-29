import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;

    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        zoneRule: true,
        vehicles: {
          select: {
            id: true,
            brand: true,
            model: true,
            plateNumber: true,
            status: true,
          },
        },
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Зона не найдена" }, { status: 404 });
    }

    return NextResponse.json({
      ...zone,
      centerLat: Number(zone.centerLat),
      centerLon: Number(zone.centerLon),
    });
  } catch (error) {
    console.error("Zone GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки зоны" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const { id } = await params;
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

    const existing = await prisma.zone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Зона не найдена" }, { status: 404 });
    }

    const updated = await prisma.zone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(centerLat !== undefined && { centerLat }),
        ...(centerLon !== undefined && { centerLon }),
        ...(radiusM !== undefined && { radiusM }),
        ...(canFinish !== undefined ||
        outOfZoneFeeCents !== undefined ||
        note !== undefined
          ? {
              zoneRule: {
                upsert: {
                  create: {
                    canFinish: canFinish ?? true,
                    outOfZoneFeeCents: outOfZoneFeeCents ?? 0,
                    note: note ?? null,
                  },
                  update: {
                    ...(canFinish !== undefined && { canFinish }),
                    ...(outOfZoneFeeCents !== undefined && { outOfZoneFeeCents }),
                    ...(note !== undefined && { note }),
                  },
                },
              },
            }
          : {}),
      },
      include: { zoneRule: true },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "update",
      entityType: "zone",
      entityId: id,
      meta: { fields: Object.keys(body) },
    });

    return NextResponse.json({
      ...updated,
      centerLat: Number(updated.centerLat),
      centerLon: Number(updated.centerLon),
    });
  } catch (error) {
    console.error("Zone PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления зоны" },
      { status: 500 }
    );
  }
}
