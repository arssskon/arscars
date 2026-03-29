"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Search, XCircle } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Reservation {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  user?: { fullName: string };
  vehicle?: { brand: string; model: string; plateNumber: string };
}

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активна" },
  { value: "canceled", label: "Отменена" },
  { value: "expired", label: "Истекла" },
  { value: "converted", label: "Конвертирована" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservationsPage() {
  const { success, error: toastError } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const pageSize = 20;

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/reservations?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setReservations(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки бронирований");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancel = async () => {
    if (!confirmId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations/${confirmId}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      await fetchReservations();
      setConfirmId(null);
    } catch {
      toastError("Ошибка отмены бронирования");
    } finally {
      setCancelLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Бронирования</h1>
        <p className="text-slate-500 mt-1">Управление бронированиями</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по коду или пользователю..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Код</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Автомобиль</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Создано</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Истекает</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Бронирования не найдены
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{r.code}</td>
                    <td className="px-4 py-3">{r.user?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.vehicle
                        ? `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.plateNumber}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} type="reservation" />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.expiresAt)}</td>
                    <td className="px-4 py-3">
                      {r.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(r.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Отменить
                        </Button>
                      )}
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
        title="Отменить бронирование?"
        description="Это действие нельзя отменить. Бронирование будет аннулировано."
        confirmLabel="Отменить бронирование"
        variant="destructive"
        onConfirm={handleCancel}
        loading={cancelLoading}
      />
    </div>
  );
}
