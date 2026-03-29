import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { IncidentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const { id } = await params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        vehicle: {
          include: {
            vehicleClass: true,
            transmission: true,
            fuelType: true,
          },
        },
        trip: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            durationMinutes: true,
            amountCents: true,
          },
        },
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
        media: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Инцидент не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...incident,
      vehicle: {
        ...incident.vehicle,
        rating: incident.vehicle.rating ? Number(incident.vehicle.rating) : null,
      },
    });
  } catch (error) {
    console.error("Incident GET error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки инцидента" },
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
  const { payload } = guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assignedTo, closedAt } = body as {
      status?: IncidentStatus;
      assignedTo?: string | null;
      closedAt?: string | null;
    };

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Инцидент не найден" },
        { status: 404 }
      );
    }

    const validStatuses: IncidentStatus[] = ["new", "in_progress", "closed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Статус должен быть одним из: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(closedAt !== undefined && {
          closedAt: closedAt ? new Date(closedAt) : null,
        }),
      },
      include: {
        reporter: { select: { id: true, fullName: true } },
        vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        assignee: { select: { id: true, fullName: true } },
        media: true,
      },
    });

    await logAudit({
      actorUserId: payload.userId,
      action: "update",
      entityType: "incident",
      entityId: id,
      meta: { fields: Object.keys(body), status },
    });

    return NextResponse.json({
      ...updated,
      vehicle: {
        ...updated.vehicle,
      },
    });
  } catch (error) {
    console.error("Incident PATCH error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления инцидента" },
      { status: 500 }
    );
  }
}
