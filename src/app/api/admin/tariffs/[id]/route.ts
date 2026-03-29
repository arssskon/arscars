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
  const { payload } = guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, pricePerMinCents, minChargeCents, roundingMode, isActive } = body;

    const existing = await prisma.tariff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Тариф не найден" }, { status: 404 });
    }

    const updated = await prisma.tariff.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(pricePerMinCents !== undefined && { pricePerMinCents }),
        ...(minChargeCents !== undefined && { minChargeCents }),
        ...(roundingMode !== undefined && { roundingMode }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "update",
      entityType: "tariff",
      entityId: id,
      meta: { fields: Object.keys(body) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Tariff PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления тарифа" },
      { status: 500 }
    );
  }
}
