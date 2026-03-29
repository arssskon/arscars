import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { unlink } from "fs/promises";
import { join } from "path";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, note } = body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action должен быть approve или reject" }, { status: 400 });
  }

  const doc = await prisma.driverDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  await prisma.driverDocument.update({
    where: { id },
    data: {
      status: newStatus,
      reviewedBy: payload.userId,
      reviewedAt: new Date(),
      note: note || null,
    },
  });

  // Пересчитываем статус верификации пользователя
  const allDocs = await prisma.driverDocument.findMany({
    where: { userId: doc.userId },
  });

  const allApproved = allDocs.length >= 2 && allDocs.every((d) => d.status === "approved");
  const anyRejected = allDocs.some((d) => d.status === "rejected");

  const verification = allApproved ? "approved" : anyRejected ? "rejected" : "pending";

  await prisma.driverProfile.upsert({
    where: { userId: doc.userId },
    update: {
      verification,
      verifiedAt: allApproved ? new Date() : null,
      rejectedReason: anyRejected ? (note || null) : null,
    },
    create: { userId: doc.userId, verification },
  });

  return NextResponse.json({ success: true, status: newStatus, verification });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  const { id } = await params;

  const doc = await prisma.driverDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Документ не найден" }, { status: 404 });

  // Удаляем файл с диска, если он был загружен через /api/upload
  if (doc.fileUrl?.startsWith("/uploads/")) {
    try {
      await unlink(join(process.cwd(), "public", doc.fileUrl));
    } catch {
      // файл уже удалён или не существует — не критично
    }
  }

  await prisma.driverDocument.delete({ where: { id } });

  // Пересчитываем статус верификации пользователя
  const remainingDocs = await prisma.driverDocument.findMany({
    where: { userId: doc.userId },
  });

  const allApproved = remainingDocs.length >= 2 && remainingDocs.every((d) => d.status === "approved");
  const anyRejected = remainingDocs.some((d) => d.status === "rejected");
  const anyPending  = remainingDocs.some((d) => d.status === "pending");
  const verification = allApproved ? "approved" : anyRejected ? "rejected" : anyPending ? "pending" : "draft";

  await prisma.driverProfile.upsert({
    where: { userId: doc.userId },
    update: { verification, verifiedAt: allApproved ? new Date() : null, rejectedReason: null },
    create: { userId: doc.userId, verification },
  });

  return NextResponse.json({ success: true, verification });
}
