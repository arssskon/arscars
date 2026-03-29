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

    const reservation = await prisma.reservation.findUnique({
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
            baseTariff: true,
          },
        },
        trip: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            durationMinutes: true,
            amountCents: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...reservation,
      vehicle: {
        ...reservation.vehicle,
        rating: reservation.vehicle.rating
          ? Number(reservation.vehicle.rating)
          : null,
      },
    });
  } catch (error) {
    console.error("Reservation GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки бронирования" },
      { status: 500 }
    );
  }
}
