import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        vehicle: {
          include: {
            vehicleClass: true,
            transmission: true,
            fuelType: true,
            lastState: true,
          },
        },
        tariff: true,
        reservation: {
          select: {
            id: true,
            code: true,
            status: true,
            createdAt: true,
            expiresAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        adjustments: {
          include: {
            operator: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        incidents: {
          include: {
            reporter: { select: { id: true, fullName: true } },
            media: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Поездка не найдена" }, { status: 404 });
    }

    return NextResponse.json({
      ...trip,
      startLat: trip.startLat ? Number(trip.startLat) : null,
      startLon: trip.startLon ? Number(trip.startLon) : null,
      endLat: trip.endLat ? Number(trip.endLat) : null,
      endLon: trip.endLon ? Number(trip.endLon) : null,
      vehicle: {
        ...trip.vehicle,
        rating: trip.vehicle.rating ? Number(trip.vehicle.rating) : null,
        lastState: trip.vehicle.lastState
          ? {
              ...trip.vehicle.lastState,
              lat: Number(trip.vehicle.lastState.lat),
              lon: Number(trip.vehicle.lastState.lon),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Trip GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки поездки" },
      { status: 500 }
    );
  }
}
