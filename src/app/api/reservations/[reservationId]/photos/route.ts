import { NextRequest, NextResponse } from "next/server";
import { getUserPayload } from "@/lib/user-guard";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { extname } from "path";
import { PhotoAngle, TripPhase } from "@prisma/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES = 10 * 1024 * 1024;
const REQUIRED_ANGLES: PhotoAngle[] = ["FRONT", "REAR", "LEFT", "RIGHT"];

type Params = { params: Promise<{ reservationId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reservationId } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.userId !== payload.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await prisma.tripPhoto.findMany({
    where: { reservationId, phase: TripPhase.START },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest, { params }: Params) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reservationId } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.userId !== payload.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reservation.status !== "active") {
    return NextResponse.json({ error: "Бронирование не активно" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const angle = formData.get("angle") as string;
  const file = formData.get("file");

  if (!REQUIRED_ANGLES.includes(angle as PhotoAngle)) {
    return NextResponse.json({ error: "angle должен быть FRONT, REAR, LEFT или RIGHT" }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Только jpg, png, webp, heic" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 10 МБ)" }, { status: 400 });
  }

  // Remove existing photo for this angle if any
  await prisma.tripPhoto.deleteMany({
    where: { reservationId, angle: angle as PhotoAngle, phase: TripPhase.START },
  });

  const ext = extname(file.name) || ".jpg";
  const filename = `reservation-photos/${reservationId}/${randomUUID()}${ext}`;
  const blob = await put(filename, file, { access: "public" });

  const photo = await prisma.tripPhoto.create({
    data: {
      reservationId,
      phase: TripPhase.START,
      angle: angle as PhotoAngle,
      url: blob.url,
      uploadedBy: payload.userId,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reservationId } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.userId !== payload.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  await prisma.tripPhoto.deleteMany({ where: { id: photoId, reservationId } });
  return NextResponse.json({ ok: true });
}
