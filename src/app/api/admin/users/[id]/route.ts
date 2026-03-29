import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        driverProfile: true,
        driverDocuments: {
          orderBy: { createdAt: "desc" },
        },
        reservations: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            vehicle: {
              select: { id: true, brand: true, model: true, plateNumber: true },
            },
          },
        },
        trips: {
          take: 10,
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            durationMinutes: true,
            amountCents: true,
            vehicle: {
              select: { id: true, brand: true, model: true, plateNumber: true },
            },
          },
        },
        reportedIncidents: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      passwordHash: undefined,
      roles: user.userRoles.map((ur) => ur.role.name),
    });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки пользователя" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { fullName, email, phone, address } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    await logAudit({
      actorUserId: guard.payload.userId,
      action: "update_user",
      entityType: "user",
      entityId: id,
      meta: { fields: Object.keys(body) },
    });

    return NextResponse.json({ id: updated.id, fullName: updated.fullName });
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json({ error: "Ошибка обновления пользователя" }, { status: 500 });
  }
}
