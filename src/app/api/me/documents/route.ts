import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";

export async function GET(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.driverDocument.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(docs.map((d) => ({
    id: d.id,
    docType: d.docType,
    docSeries: d.docSeries,
    docNumber: d.docNumber,
    issueDate: d.issueDate,
    expiryDate: d.expiryDate,
    fileUrl: d.fileUrl,
    status: d.status,
    note: d.note,
    createdAt: d.createdAt,
  })));
}

export async function POST(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { docType, docSeries, docNumber, issueDate, expiryDate, fileUrl } = body;

  if (!docType || !docNumber) {
    return NextResponse.json({ error: "docType и docNumber обязательны" }, { status: 400 });
  }

  // Upsert: один документ каждого типа на пользователя
  const existing = await prisma.driverDocument.findFirst({
    where: { userId: payload.userId, docType },
  });

  const doc = existing
    ? await prisma.driverDocument.update({
        where: { id: existing.id },
        data: {
          docSeries: docSeries || null,
          docNumber,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          fileUrl: fileUrl || null,
          status: "pending",
          note: null,
        },
      })
    : await prisma.driverDocument.create({
        data: {
          userId: payload.userId,
          docType,
          docSeries: docSeries || null,
          docNumber,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          fileUrl: fileUrl || null,
          status: "pending",
        },
      });

  // Обновляем driverProfile до pending если ещё draft
  await prisma.driverProfile.upsert({
    where: { userId: payload.userId },
    update: { verification: "pending" },
    create: { userId: payload.userId, verification: "pending" },
  });

  return NextResponse.json({ id: doc.id, status: doc.status });
}
