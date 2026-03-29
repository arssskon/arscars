import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classIds = searchParams.get("classIds")?.split(",").map(Number).filter(Boolean);
    const transmissionIds = searchParams.get("transmissionIds")?.split(",").map(Number).filter(Boolean);
    const fuelTypeIds = searchParams.get("fuelTypeIds")?.split(",").map(Number).filter(Boolean);
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

    const where: Record<string, unknown> = { status: "available" };
    if (classIds?.length) where.classId = { in: classIds };
    if (transmissionIds?.length) where.transmissionId = { in: transmissionIds };
    if (fuelTypeIds?.length) where.fuelTypeId = { in: fuelTypeIds };
    if (minPrice && maxPrice) where.baseTariff = { pricePerMinCents: { gte: minPrice, lte: maxPrice } };
    else if (minPrice) where.baseTariff = { pricePerMinCents: { gte: minPrice } };
    else if (maxPrice) where.baseTariff = { pricePerMinCents: { lte: maxPrice } };

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        vehicleClass: true,
        transmission: true,
        fuelType: true,
        baseTariff: true,
        lastState: true,
      },
    });

    const data = vehicles.map((v) => ({
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
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Public vehicles GET error:", error);
    return NextResponse.json({ error: "Ошибка загрузки автомобилей" }, { status: 500 });
  }
}
