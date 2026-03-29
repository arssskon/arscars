import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { UserStatus, RoleName } from "@prisma/client";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") as UserStatus | null;
    const role = searchParams.get("role") as RoleName | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (role) {
      where.userRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          birthDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: { role: true },
          },
          driverProfile: {
            select: {
              verification: true,
              verifiedAt: true,
              rejectedReason: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role.name),
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки пользователей" },
      { status: 500 }
    );
  }
}
