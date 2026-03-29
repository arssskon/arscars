"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArrowLeft, StopCircle } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Payment {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
}

interface Incident {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}

interface TripDetail {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  totalAmountCents?: number;
  user?: { id: string; fullName: string; email?: string };
  vehicle?: { id: string; brand: string; model: string; plateNumber: string };
  tariff?: { name: string };
  reservation?: { code: string };
  payments?: Payment[];
  incidents?: Incident[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(cents?: number) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("ru-RU") + " ₽";
}

function formatDuration(start: string, end?: string) {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}ч ${mins}мин` : `${mins}мин`;
}

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { success, error: toastError } = useToast();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/trips/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setTrip)
      .catch(() => toastError("Ошибка загрузки поездки"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleForceFinish = async () => {
    setForceLoading(true);
    try {
      const res = await fetch(`/api/admin/trips/${id}/force-finish`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const updated = await fetch(`/api/admin/trips/${id}`, { credentials: "include" }).then((r) => r.json());
      setTrip(updated);
      setConfirmOpen(false);
      success("Поездка завершена");
    } catch {
      toastError("Ошибка принудительного завершения");
    } finally {
      setForceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6">
        <p className="text-red-500">Поездка не найдена</p>
        <Link href="/admin/trips">
          <Button variant="outline" className="mt-4">Назад</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/trips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Поездка</h1>
          <p className="text-slate-500 font-mono text-sm mt-0.5">{trip.id}</p>
        </div>
        {trip.status === "active" && (
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            <StopCircle className="h-4 w-4" />
            Принудительно завершить
          </Button>
        )}
      </div>

      {/* Main info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Информация о поездке</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Статус</span>
              <StatusBadge status={trip.status} type="trip" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Тариф</span>
              <span className="text-sm font-medium">{trip.tariff?.name || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Начало</span>
              <span className="text-sm">{formatDate(trip.startedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Конец</span>
              <span className="text-sm">{trip.finishedAt ? formatDate(trip.finishedAt) : "В процессе"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Длительность</span>
              <span className="text-sm">{formatDuration(trip.startedAt, trip.finishedAt)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-slate-500">Итоговая сумма</span>
              <span className="text-base font-bold">{formatAmount(trip.totalAmountCents)}</span>
            </div>
            {trip.reservation && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Бронирование</span>
                <span className="text-sm font-mono">{trip.reservation.code}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* User info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Пользователь</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{trip.user?.fullName || "—"}</p>
              {trip.user?.email && (
                <p className="text-sm text-slate-500">{trip.user.email}</p>
              )}
              {trip.user?.id && (
                <Link href={`/admin/users/${trip.user.id}`}>
                  <Button variant="link" className="h-auto p-0 text-violet-600">
                    Перейти к профилю
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Vehicle info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Автомобиль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">
                {trip.vehicle ? `${trip.vehicle.brand} ${trip.vehicle.model}` : "—"}
              </p>
              {trip.vehicle?.plateNumber && (
                <p className="text-sm font-mono text-slate-500">{trip.vehicle.plateNumber}</p>
              )}
              {trip.vehicle?.id && (
                <Link href={`/admin/vehicles/${trip.vehicle.id}`}>
                  <Button variant="link" className="h-auto p-0 text-violet-600">
                    Перейти к автомобилю
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payments */}
      {trip.payments && trip.payments.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Платежи</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Сумма</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-medium">{formatAmount(p.amountCents)}</td>
                      <td className="px-4 py-3">{p.status}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incidents */}
      {trip.incidents && trip.incidents.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Инциденты</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Тип</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.incidents.map((inc) => (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <StatusBadge status={inc.type} type="incidentType" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inc.status} type="incidentStatus" />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inc.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Принудительно завершить поездку?"
        description="Поездка будет завершена принудительно. Стоимость будет рассчитана на текущий момент."
        confirmLabel="Завершить"
        variant="destructive"
        onConfirm={handleForceFinish}
        loading={forceLoading}
      />
    </div>
  );
}
