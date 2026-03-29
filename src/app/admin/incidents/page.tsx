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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Incident {
  id: string;
  type: string;
  status: string;
  description?: string;
  createdAt: string;
  closedAt?: string;
  user?: { id: string; fullName: string };
  vehicle?: { id: string; brand: string; model: string; plateNumber: string };
  assignedTo?: { fullName: string };
  trip?: { id: string };
}

const TYPE_OPTIONS = [
  { value: "all", label: "Все типы" },
  { value: "damage", label: "Повреждение" },
  { value: "accident", label: "ДТП" },
  { value: "fine", label: "Штраф" },
  { value: "evacuation", label: "Эвакуация" },
  { value: "other", label: "Другое" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В работе" },
  { value: "closed", label: "Закрытые" },
];

const NEXT_STATUS: Record<string, string> = {
  new: "in_progress",
  in_progress: "closed",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IncidentsPage() {
  const { success, error: toastError } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [assignInput, setAssignInput] = useState("");
  const [updating, setUpdating] = useState(false);

  const pageSize = 20;

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/incidents?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setIncidents(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки инцидентов");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleStatusChange = async (incident: Incident, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incident.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      await fetchIncidents();
      if (detailIncident?.id === incident.id) {
        setDetailIncident((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      toastError("Ошибка изменения статуса инцидента");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (incident: Incident) => {
    if (!assignInput.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incident.id}/assign`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignInput.trim() }),
      });
      if (!res.ok) throw new Error();
      await fetchIncidents();
      setAssignInput("");
    } catch {
      toastError("Ошибка назначения ответственного");
    } finally {
      setUpdating(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Инциденты</h1>
        <p className="text-slate-500 mt-1">Управление инцидентами</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Ответственный</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Создан</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Закрыт</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Инциденты не найдены
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetailIncident(inc)}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={inc.type} type="incidentType" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inc.status} type="incidentStatus" />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inc.user?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {inc.vehicle
                        ? `${inc.vehicle.brand} ${inc.vehicle.model} · ${inc.vehicle.plateNumber}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inc.assignedTo?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(inc.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {inc.closedAt ? formatDate(inc.closedAt) : "—"}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {NEXT_STATUS[inc.status] && (
                        <Select
                          value={inc.status}
                          onValueChange={(v) => handleStatusChange(inc, v)}
                          disabled={updating}
                        >
                          <SelectTrigger className="h-8 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Новый</SelectItem>
                            <SelectItem value="in_progress">В работе</SelectItem>
                            <SelectItem value="closed">Закрыт</SelectItem>
                          </SelectContent>
                        </Select>
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

      {/* Detail modal */}
      <Dialog open={!!detailIncident} onOpenChange={(o) => !o && setDetailIncident(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Инцидент
              {detailIncident && (
                <StatusBadge status={detailIncident.type} type="incidentType" />
              )}
            </DialogTitle>
          </DialogHeader>
          {detailIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Статус</p>
                  <StatusBadge status={detailIncident.status} type="incidentStatus" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Создан</p>
                  <p className="text-sm">{formatDate(detailIncident.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Пользователь</p>
                  <p className="text-sm font-medium">{detailIncident.user?.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Автомобиль</p>
                  <p className="text-sm font-medium">
                    {detailIncident.vehicle
                      ? `${detailIncident.vehicle.brand} ${detailIncident.vehicle.model}`
                      : "—"}
                  </p>
                </div>
                {detailIncident.assignedTo && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Ответственный</p>
                    <p className="text-sm font-medium">{detailIncident.assignedTo.fullName}</p>
                  </div>
                )}
                {detailIncident.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Описание</p>
                    <p className="text-sm text-slate-700">{detailIncident.description}</p>
                  </div>
                )}
              </div>

              {/* Change status */}
              {NEXT_STATUS[detailIncident.status] && (
                <div className="border-t pt-4">
                  <Label className="text-xs">Изменить статус</Label>
                  <div className="flex gap-2 mt-2">
                    <Select
                      value={detailIncident.status}
                      onValueChange={(v) => handleStatusChange(detailIncident, v)}
                      disabled={updating}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новый</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="closed">Закрыт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Assign */}
              <div className="border-t pt-4">
                <Label className="text-xs">Назначить ответственного (ID пользователя)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={assignInput}
                    onChange={(e) => setAssignInput(e.target.value)}
                    placeholder="UUID пользователя"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleAssign(detailIncident)}
                    disabled={updating || !assignInput.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Назначить
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
