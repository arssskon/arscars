"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, CalendarCheck, Route, Users, AlertTriangle, Wrench, CheckCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface DashboardData {
  vehicles: {
    total: number;
    available: number;
    in_trip: number;
    service: number;
  };
  activeReservations: number;
  activeTrips: number;
  openIncidents: number;
  activeUsers: number;
  recentTrips: Array<{
    id: string;
    user: { fullName: string };
    vehicle: { brand: string; model: string };
    status: string;
    totalAmountCents: number;
    startedAt: string;
  }>;
  recentIncidents: Array<{
    id: string;
    type: string;
    status: string;
    user?: { fullName: string };
    vehicle?: { brand: string; model: string };
    createdAt: string;
  }>;
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("ru-RU") + " ₽";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Ошибка загрузки данных");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = data
    ? [
        {
          title: "Всего автомобилей",
          value: data.vehicles.total,
          icon: Car,
          color: "text-slate-600",
          bg: "bg-slate-100",
        },
        {
          title: "Доступно",
          value: data.vehicles.available,
          icon: CheckCircle,
          color: "text-emerald-600",
          bg: "bg-emerald-100",
        },
        {
          title: "В поездке",
          value: data.vehicles.in_trip,
          icon: Route,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          title: "На сервисе",
          value: data.vehicles.service,
          icon: Wrench,
          color: "text-orange-600",
          bg: "bg-orange-100",
        },
        {
          title: "Активных броней",
          value: data.activeReservations,
          icon: CalendarCheck,
          color: "text-violet-600",
          bg: "bg-violet-100",
        },
        {
          title: "Активных поездок",
          value: data.activeTrips,
          icon: Clock,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          title: "Открытых инцидентов",
          value: data.openIncidents,
          icon: AlertTriangle,
          color: "text-red-600",
          bg: "bg-red-100",
        },
        {
          title: "Активных пользователей",
          value: data.activeUsers,
          icon: Users,
          color: "text-indigo-600",
          bg: "bg-indigo-100",
        },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <p className="text-slate-500 mt-1">Обзор состояния системы</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <Card key={card.title} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Последние поездки</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : data?.recentTrips.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-400">Нет данных</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentTrips.map((trip) => (
                      <tr key={trip.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{trip.user?.fullName || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {trip.vehicle
                            ? `${trip.vehicle.brand} ${trip.vehicle.model}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={trip.status} type="trip" />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {trip.totalAmountCents != null
                            ? formatAmount(trip.totalAmountCents)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Последние инциденты</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : data?.recentIncidents.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-400">Нет данных</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Тип</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentIncidents.map((incident) => (
                      <tr key={incident.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <StatusBadge status={incident.type} type="incidentType" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={incident.status} type="incidentStatus" />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{incident.user?.fullName || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {incident.vehicle
                            ? `${incident.vehicle.brand} ${incident.vehicle.model}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(incident.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
