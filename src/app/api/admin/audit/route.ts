import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data = logs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      meta: log.meta,
      createdAt: log.createdAt,
      actorUser: log.actorUser,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки аудит-лога" },
      { status: 500 }
    );
  }
}
