"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { Search, StopCircle, Eye } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Trip {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  durationMinutes?: number;
  amountCents?: number;
  user?: { id: string; fullName: string };
  vehicle?: { id: string; brand: string; model: string; plateNumber: string };
  tariff?: { name: string };
}

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активна" },
  { value: "finished", label: "Завершена" },
  { value: "forced_finished", label: "Принудительно завершена" },
  { value: "canceled", label: "Отменена" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatAmount(cents?: number) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("ru-RU") + " ₽";
}

function formatDuration(minutes?: number, start?: string, end?: string) {
  const mins = minutes ?? (start
    ? Math.floor(((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 60000)
    : null);
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}ч ${m}мин` : `${m}мин`;
}

export default function TripsPage() {
  const { success, error: toastError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [forceLoading, setForceLoading] = useState(false);

  const pageSize = 20;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/trips?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTrips(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки поездок");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleForceFinish = async () => {
    if (!confirmId) return;
    setForceLoading(true);
    try {
      const res = await fetch(`/api/admin/trips/${confirmId}/force-finish`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      await fetchTrips();
      setConfirmId(null);
      success("Поездка завершена");
    } catch {
      toastError("Ошибка принудительного завершения поездки");
    } finally {
      setForceLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Поездки</h1>
        <p className="text-slate-500 mt-1">Управление поездками · {total} всего</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по пользователю или авто..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Тариф</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Начало</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Длит.</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Сумма</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Поездки не найдены
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {t.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      {t.user ? (
                        <Link
                          href={`/admin/users/${t.user.id}`}
                          className="font-medium text-violet-700 hover:underline"
                        >
                          {t.user.fullName}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {t.vehicle ? (
                        <>
                          <p className="font-medium text-sm text-slate-800">{t.vehicle.brand} {t.vehicle.model}</p>
                          <p className="text-slate-400 font-mono">{t.vehicle.plateNumber}</p>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.tariff?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} type="trip" />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(t.startedAt)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDuration(t.durationMinutes, t.startedAt, t.finishedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatAmount(t.amountCents)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View detail */}
                        <Link href={`/admin/trips/${t.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 h-8">
                            <Eye className="h-3 w-3" />
                            Детали
                          </Button>
                        </Link>

                        {/* Force finish only for active trips */}
                        {t.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={() => setConfirmId(t.id)}
                          >
                            <StopCircle className="h-3 w-3" />
                            Завершить
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50">
            <p className="text-sm text-slate-500">
              Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="Принудительно завершить поездку?"
        description="Поездка будет завершена немедленно. Стоимость рассчитается на текущий момент. Автомобиль перейдёт в статус «Доступен»."
        confirmLabel="Завершить поездку"
        variant="destructive"
        onConfirm={handleForceFinish}
        loading={forceLoading}
      />
    </div>
  );
}
