import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  const [classes, transmissions, fuelTypes] = await Promise.all([
    prisma.vehicleClass.findMany({ orderBy: { id: "asc" } }),
    prisma.transmission.findMany({ orderBy: { id: "asc" } }),
    prisma.fuelType.findMany({ orderBy: { id: "asc" } }),
  ]);

  return NextResponse.json({ classes, transmissions, fuelTypes });
}
