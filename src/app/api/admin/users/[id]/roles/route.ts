import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { RoleName } from "@prisma/client";

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
    const { roles } = body as { roles: string[] };

    const validRoles: RoleName[] = ["admin", "driver", "support"];
    if (!Array.isArray(roles) || roles.some((r) => !validRoles.includes(r as RoleName))) {
      return NextResponse.json(
        { error: `Роли должны быть из: ${validRoles.join(", ")}` },
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

    // Load role records
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles as RoleName[] } },
    });

    if (roleRecords.length !== roles.length) {
      return NextResponse.json(
        { error: "Одна или несколько ролей не найдены в БД" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userRole.createMany({
        data: roleRecords.map((role) => ({ userId: id, roleId: role.id })),
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "roles_change",
      entityType: "user",
      entityId: id,
      meta: { roles },
    });

    return NextResponse.json({
      id,
      roles: updatedUser?.userRoles.map((ur) => ur.role.name) ?? [],
    });
  } catch (error) {
    console.error("User roles PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка изменения ролей пользователя" },
      { status: 500 }
    );
  }
}
