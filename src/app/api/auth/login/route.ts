import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password } = body;

    if (!password || (!email && !phone)) {
      return NextResponse.json(
        { error: "Email или телефон и пароль обязательны" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as { email?: string; phone?: string }[],
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Неверный email/телефон или пароль" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный email/телефон или пароль" },
        { status: 401 }
      );
    }

    if (user.status === "blocked") {
      return NextResponse.json(
        { error: "Аккаунт заблокирован" },
        { status: 403 }
      );
    }

    if (user.status === "deleted") {
      return NextResponse.json(
        { error: "Аккаунт не найден" },
        { status: 404 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.name as string);

    const token = signToken({ userId: user.id, roles });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        roles,
      },
      token,
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Ошибка авторизации" },
      { status: 500 }
    );
  }
}
