import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPayload } from "@/lib/user-guard";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const payload = getUserPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Необходимы currentPassword и newPassword" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash: hash } });

  return NextResponse.json({ success: true });
}
