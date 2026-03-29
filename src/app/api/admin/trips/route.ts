import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { TripStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") as TripStatus | null;
    const userId = searchParams.get("userId");
    const vehicleId = searchParams.get("vehicleId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (dateFrom || dateTo) {
      where.startedAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
        { vehicle: { model: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              plateNumber: true,
              status: true,
            },
          },
          tariff: { select: { id: true, name: true, pricePerMinCents: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    const data = trips.map((t) => ({
      ...t,
      startLat: t.startLat ? Number(t.startLat) : null,
      startLon: t.startLon ? Number(t.startLon) : null,
      endLat: t.endLat ? Number(t.endLat) : null,
      endLon: t.endLon ? Number(t.endLon) : null,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Trips GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки поездок" },
      { status: 500 }
    );
  }
}
