import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: tariffs, total: tariffs.length });
  } catch (error) {
    console.error("Tariffs GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки тарифов" },
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
    const { name, pricePerMinCents, minChargeCents, roundingMode, isActive } = body;

    if (!name || pricePerMinCents === undefined || minChargeCents === undefined) {
      return NextResponse.json(
        { error: "Обязательные поля: name, pricePerMinCents, minChargeCents" },
        { status: 400 }
      );
    }

    const tariff = await prisma.tariff.create({
      data: {
        name,
        pricePerMinCents,
        minChargeCents,
        roundingMode: roundingMode ?? "ceil_minute",
        isActive: isActive ?? true,
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "create",
      entityType: "tariff",
      entityId: tariff.id,
      meta: { name: tariff.name },
    });

    return NextResponse.json(tariff, { status: 201 });
  } catch (error) {
    console.error("Tariffs POST error:", error);
    return NextResponse.json(
      { error: "Ошибка создания тарифа" },
      { status: 500 }
    );
  }
}
