import { NextRequest, NextResponse } from "next/server";
import { getUserPayload } from "@/lib/user-guard";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { extname } from "path";
import { TripPhase, PhotoAngle } from "@prisma/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_PHASES = Object.values(TripPhase);
const VALID_ANGLES = Object.values(PhotoAngle);

async function getAccessibleTrip(tripId: string, userId: string, roles: string[]) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return null;

  const isAdmin = roles.includes("admin") || roles.includes("support");
  if (isAdmin) return trip;

  if (trip.userId === userId) return trip;

  const ownerListing = trip.vehicleId
    ? await prisma.ownerListing.findFirst({ where: { vehicleId: trip.vehicleId, userId } })
    : null;
  if (ownerListing) return trip;

  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const trip = await getAccessibleTrip(tripId, payload.userId, payload.roles);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const phaseParam = searchParams.get("phase");

  const photos = await prisma.tripPhoto.findMany({
    where: {
      tripId,
      ...(phaseParam && VALID_PHASES.includes(phaseParam as TripPhase)
        ? { phase: phaseParam as TripPhase }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = photos.reduce<Record<string, typeof photos>>((acc, p) => {
    if (!acc[p.angle]) acc[p.angle] = [];
    acc[p.angle].push(p);
    return acc;
  }, {});

  return NextResponse.json({ photos, grouped });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const trip = await getAccessibleTrip(tripId, payload.userId, payload.roles);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const phase = formData.get("phase") as string;
  const angle = formData.get("angle") as string;
  const note = formData.get("note") as string | null;
  const file = formData.get("file");

  if (!VALID_PHASES.includes(phase as TripPhase)) {
    return NextResponse.json({ error: "Неверная фаза (START или END)" }, { status: 400 });
  }
  if (!VALID_ANGLES.includes(angle as PhotoAngle)) {
    return NextResponse.json({ error: "Неверный ракурс" }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Только jpg, png, webp, heic" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 10 МБ)" }, { status: 400 });
  }

  const ext = extname(file.name) || ".jpg";
  const filename = `trip-photos/${tripId}/${randomUUID()}${ext}`;
  const blob = await put(filename, file, { access: "public" });

  const photo = await prisma.tripPhoto.create({
    data: {
      tripId,
      phase: phase as TripPhase,
      angle: angle as PhotoAngle,
      url: blob.url,
      note: note || null,
      uploadedBy: payload.userId,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const photo = await prisma.tripPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.tripId !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = payload.roles.includes("admin") || payload.roles.includes("support");
  if (!isAdmin && photo.uploadedBy !== payload.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tripPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ ok: true });
}
