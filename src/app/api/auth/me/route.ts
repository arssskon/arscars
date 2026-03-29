import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth-token")?.value;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jwtPayload = verifyToken(token);
    if (!jwtPayload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      include: {
        userRoles: {
          include: { role: true },
        },
        driverProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status === "deleted") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roles = user.userRoles.map((ur) => ur.role.name as string);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      birthDate: user.birthDate,
      address: user.address,
      status: user.status,
      roles,
      driverProfile: user.driverProfile
        ? {
            verification: user.driverProfile.verification,
            verifiedAt: user.driverProfile.verifiedAt,
            rejectedReason: user.driverProfile.rejectedReason,
          }
        : null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Ошибка получения профиля" },
      { status: 500 }
    );
  }
}
