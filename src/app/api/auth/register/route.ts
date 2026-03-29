import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password, fullName } = body;

    if (!fullName || !password || (!email && !phone)) {
      return NextResponse.json(
        { error: "Имя, пароль и email или телефон обязательны" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as { email?: string; phone?: string }[],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email или телефоном уже существует" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Find or create the "driver" role
    const driverRole = await prisma.role.findUnique({
      where: { name: "driver" },
    });

    if (!driverRole) {
      return NextResponse.json(
        { error: "Роль driver не найдена в базе данных" },
        { status: 500 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        passwordHash,
        fullName,
        status: "active",
        userRoles: {
          create: {
            roleId: driverRole.id,
          },
        },
        driverProfile: {
          create: {
            verification: "draft",
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name as string);
    const token = signToken({ userId: user.id, roles });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          roles,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Ошибка регистрации" },
      { status: 500 }
    );
  }
}
