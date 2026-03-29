import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const validStatuses = ["draft", "pending", "approved", "rejected"] as const;
  type VS = typeof validStatuses[number];
  const whereStatus = validStatuses.includes(status as VS) ? (status as VS) : undefined;

  const docs = await prisma.driverDocument.findMany({
    where: whereStatus ? { status: whereStatus } : {},
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return NextResponse.json(docs);
}
