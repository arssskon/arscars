import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  const guard = getAdminPayload(req);
  if ("error" in guard) return guard.error;

  try {
    const [
      totalVehicles,
      availableVehicles,
      inTripVehicles,
      serviceVehicles,
      blockedVehicles,
      reservedVehicles,
      activeReservations,
      expiredReservations,
      activeTrips,
      openIncidents,
      activeUsers,
      blockedUsers,
      recentActivity,
      recentTrips,
      recentIncidents,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "available" } }),
      prisma.vehicle.count({ where: { status: "in_trip" } }),
      prisma.vehicle.count({ where: { status: "service" } }),
      prisma.vehicle.count({ where: { status: "blocked" } }),
      prisma.vehicle.count({ where: { status: "reserved" } }),
      prisma.reservation.count({ where: { status: "active" } }),
      prisma.reservation.count({ where: { status: "expired" } }),
      prisma.trip.count({ where: { status: "active" } }),
      prisma.incident.count({ where: { status: "new" } }),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "blocked" } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actorUser: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.trip.findMany({
        take: 5,
        orderBy: { startedAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        },
      }),
      prisma.incident.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          vehicle: { select: { id: true, brand: true, model: true, plateNumber: true } },
        },
      }),
    ]);

    return NextResponse.json({
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        in_trip: inTripVehicles,
        service: serviceVehicles,
        blocked: blockedVehicles,
        reserved: reservedVehicles,
      },
      reservations: {
        active: activeReservations,
        expired: expiredReservations,
      },
      trips: { active: activeTrips },
      incidents: { open: openIncidents },
      users: { active: activeUsers, blocked: blockedUsers },
      recentActivity: recentActivity.map((log) => ({
        id: log.id.toString(),
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        meta: log.meta,
        createdAt: log.createdAt,
        actorUser: log.actorUser,
      })),
      recentTrips: recentTrips.map((trip) => ({
        id: trip.id,
        status: trip.status,
        startedAt: trip.startedAt,
        finishedAt: trip.finishedAt,
        durationMinutes: trip.durationMinutes,
        amountCents: trip.amountCents,
        user: trip.user,
        vehicle: trip.vehicle,
      })),
      recentIncidents: recentIncidents.map((inc) => ({
        id: inc.id,
        type: inc.type,
        status: inc.status,
        description: inc.description,
        createdAt: inc.createdAt,
        reporter: inc.reporter,
        vehicle: inc.vehicle,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки дашборда" },
      { status: 500 }
    );
  }
}
