import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { IncidentStatus, IncidentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as IncidentStatus | null;
    const type = searchParams.get("type") as IncidentType | null;
    const userId = searchParams.get("userId");
    const vehicleId = searchParams.get("vehicleId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              plateNumber: true,
              status: true,
            },
          },
          trip: {
            select: { id: true, status: true, startedAt: true },
          },
          assignee: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    return NextResponse.json({ data: incidents, total, page, limit });
  } catch (error) {
    console.error("Incidents GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки инцидентов" },
      { status: 500 }
    );
  }
}
