import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const v = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        vehicleClass: true,
        transmission: true,
        fuelType: true,
        baseTariff: true,
        lastState: true,
        defaultZone: true,
      },
    });

    if (!v) {
      return NextResponse.json({ error: "Не найден" }, { status: 404 });
    }

    return NextResponse.json({
      id: v.id,
      brand: v.brand,
      model: v.model,
      plateNumber: v.plateNumber,
      year: v.year,
      status: v.status,
      photoUrl: v.photoUrl,
      rating: v.rating ? Number(v.rating) : null,
      vehicleClass: v.vehicleClass,
      transmission: v.transmission,
      fuelType: v.fuelType,
      baseTariff: v.baseTariff,
      lastState: v.lastState
        ? {
            lat: Number(v.lastState.lat),
            lon: Number(v.lastState.lon),
            fuelPercent: v.lastState.fuelPercent,
            chargePercent: v.lastState.chargePercent,
          }
        : null,
      zoneName: v.defaultZone?.name ?? null,
    });
  } catch (error) {
    console.error("Public vehicle GET error:", error);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
