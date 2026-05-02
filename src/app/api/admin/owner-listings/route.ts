import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { OwnerListingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  const where = statusParam ? { status: statusParam as OwnerListingStatus } : {};

  const [listings, pendingCount] = await Promise.all([
    prisma.ownerListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, email: true, phone: true } } },
    }),
    prisma.ownerListing.count({ where: { status: "PENDING" } }),
  ]);

  const data = listings.map((l) => ({
    ...l,
    pricePerMinute: Number(l.pricePerMinute),
    minCharge: Number(l.minCharge),
    latitude: l.latitude ? Number(l.latitude) : null,
    longitude: l.longitude ? Number(l.longitude) : null,
  }));

  const res = NextResponse.json({ data, total: listings.length });
  res.headers.set("X-Pending-Count", String(pendingCount));
  return res;
}
