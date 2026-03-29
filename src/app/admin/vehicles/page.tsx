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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  Plus,
  Search,
  Pencil,
  Settings2,
  WrenchIcon,
  ShieldOff,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/admin/Toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  year: number;
  status: string;
  photoUrl?: string;
  vehicleClass?: { name: string };
  transmission?: { name: string };
  fuelType?: { name: string };
  baseTariff?: { name: string };
  updatedAt: string;
}

const VEHICLE_STATUSES = [
  { value: "all", label: "Все статусы" },
  { value: "available", label: "Доступен" },
  { value: "reserved", label: "Забронирован" },
  { value: "in_trip", label: "В поездке" },
  { value: "service", label: "Сервис" },
  { value: "blocked", label: "Заблокирован" },
];

const STATUS_LABELS: Record<string, string> = {
  available: "Доступен",
  reserved: "Забронирован",
  in_trip: "В поездке",
  service: "Сервис",
  blocked: "Заблокирован",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function VehiclesPage() {
  const { success, error: toastError } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status change modal
  const [statusModal, setStatusModal] = useState<{ vehicle: Vehicle } | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Confirm for destructive actions
  const [confirmState, setConfirmState] = useState<{
    vehicleId: string;
    newStatus: string;
    label: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = 20;

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/vehicles?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setVehicles(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки автомобилей");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const openStatusModal = (vehicle: Vehicle) => {
    setStatusModal({ vehicle });
    setNewStatus("");
    setStatusReason("");
  };

  const handleStatusChange = async (vehicleId: string, status: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error();
      await fetchVehicles();
      setConfirmState(null);
      setStatusModal(null);
      success("Статус автомобиля изменён");
    } catch {
      toastError("Ошибка изменения статуса");
    } finally {
      setActionLoading(false);
      setStatusLoading(false);
    }
  };

  const handleStatusModalSubmit = async () => {
    if (!statusModal || !newStatus) return;
    setStatusLoading(true);
    await handleStatusChange(statusModal.vehicle.id, newStatus, statusReason);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Автомобили</h1>
          <p className="text-slate-500 mt-1">Управление автопарком · {total} авто</p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Добавить авто
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по модели или номеру..."
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
                {VEHICLE_STATUSES.map((s) => (
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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Фото</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Номер</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Класс / КПП / Топливо</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Тариф</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Обновлён</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Автомобили не найдены
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {v.photoUrl ? (
                        <img src={v.photoUrl} alt="" className="h-10 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-16 bg-slate-200 rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{v.brand} {v.model}</p>
                      <p className="text-xs text-slate-400">{v.year}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{v.plateNumber}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <span>{v.vehicleClass?.name ?? "—"}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span>{v.transmission?.name ?? "—"}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span>{v.fuelType?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} type="vehicle" />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.baseTariff?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(v.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Edit */}
                        <Link href={`/admin/vehicles/${v.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 h-8">
                            <Pencil className="h-3 w-3" />
                            Изменить
                          </Button>
                        </Link>

                        {/* Quick status buttons based on current status */}
                        {v.status === "available" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={() => setConfirmState({ vehicleId: v.id, newStatus: "service", label: "отправить в сервис" })}
                          >
                            <WrenchIcon className="h-3 w-3" />
                            Сервис
                          </Button>
                        )}
                        {v.status === "service" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setConfirmState({ vehicleId: v.id, newStatus: "available", label: "вернуть в доступные" })}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Вернуть
                          </Button>
                        )}
                        {v.status === "blocked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setConfirmState({ vehicleId: v.id, newStatus: "available", label: "разблокировать" })}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Разблок
                          </Button>
                        )}
                        {v.status !== "blocked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setConfirmState({ vehicleId: v.id, newStatus: "blocked", label: "заблокировать" })}
                          >
                            <ShieldOff className="h-3 w-3" />
                            Блок
                          </Button>
                        )}
                        {/* Other statuses via modal */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-8 text-slate-500"
                          onClick={() => openStatusModal(v)}
                        >
                          <Settings2 className="h-3 w-3" />
                          Статус
                        </Button>
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

      {/* Status change modal */}
      <Dialog open={!!statusModal} onOpenChange={(o) => !o && setStatusModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Изменить статус · {statusModal?.vehicle.brand} {statusModal?.vehicle.model}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Новый статус</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS)
                    .filter(([k]) => k !== statusModal?.vehicle.status)
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Причина (необязательно)</Label>
              <Input
                placeholder="Укажите причину изменения..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModal(null)}>Отмена</Button>
            <Button
              disabled={!newStatus || statusLoading}
              onClick={handleStatusModalSubmit}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {statusLoading ? "Сохранение..." : "Применить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick action confirm */}
      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => !o && setConfirmState(null)}
        title="Изменить статус автомобиля?"
        description={`Вы собираетесь ${confirmState?.label}.`}
        confirmLabel="Подтвердить"
        variant={confirmState?.newStatus === "blocked" ? "destructive" : "default"}
        onConfirm={() => confirmState && handleStatusChange(confirmState.vehicleId, confirmState.newStatus)}
        loading={actionLoading}
      />
    </div>
  );
}
