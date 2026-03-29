import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { UserStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;
  const { payload } = guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: UserStatus };

    const validStatuses: UserStatus[] = ["active", "blocked"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Статус должен быть active или blocked" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        status: true,
        updatedAt: true,
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "status_change",
      entityType: "user",
      entityId: id,
      meta: { prevStatus: existing.status, nextStatus: status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("User status PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка изменения статуса пользователя" },
      { status: 500 }
    );
  }
}
