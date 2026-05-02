import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function POST(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    make, model, year, plateNumber, color, photoUrls,
    pricePerMinute, minCharge, vehicleClass, transmission,
    fuelType, ownerPhone, address, description,
    latitude, longitude, availableFrom, availableTo,
  } = body;

  if (
    !make || !model || !year || !plateNumber || !color ||
    !Array.isArray(photoUrls) || photoUrls.length === 0 || !photoUrls[0] ||
    !pricePerMinute || !minCharge || !vehicleClass ||
    !transmission || !fuelType || !ownerPhone || !address
  ) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  try {
    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.ownerListing.create({
        data: {
          userId: payload.userId,
          make,
          model,
          year: Number(year),
          plateNumber,
          color,
          description: description || null,
          photoUrls,
          pricePerMinute,
          minCharge,
          vehicleClass,
          transmission,
          fuelType,
          ownerPhone,
          address,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          availableTo: availableTo ? new Date(availableTo) : null,
          status: "PENDING",
        },
      });

      const ownerRole = await tx.role.findUnique({ where: { name: "owner" } });
      if (ownerRole) {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: payload.userId, roleId: ownerRole.id } },
          create: { userId: payload.userId, roleId: ownerRole.id },
          update: {},
        });
      }

      return created;
    });

    return NextResponse.json(
      { ...listing, pricePerMinute: Number(listing.pricePerMinute), minCharge: Number(listing.minCharge) },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") && msg.includes("plateNumber")) {
      return NextResponse.json({ error: "Автомобиль с таким номером уже зарегистрирован" }, { status: 409 });
    }
    console.error("Owner listing create error:", err);
    return NextResponse.json({ error: "Ошибка создания заявки" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listings = await prisma.ownerListing.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    listings.map((l) => ({
      ...l,
      pricePerMinute: Number(l.pricePerMinute),
      minCharge: Number(l.minCharge),
      latitude: l.latitude ? Number(l.latitude) : null,
      longitude: l.longitude ? Number(l.longitude) : null,
    }))
  );
}
