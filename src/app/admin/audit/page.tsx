"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor?: { fullName: string; email?: string };
  createdAt: string;
  meta?: Record<string, unknown>;
}

const ENTITY_TYPES = [
  { value: "all", label: "Все сущности" },
  { value: "vehicle", label: "Автомобиль" },
  { value: "user", label: "Пользователь" },
  { value: "trip", label: "Поездка" },
  { value: "reservation", label: "Бронирование" },
  { value: "tariff", label: "Тариф" },
  { value: "zone", label: "Зона" },
  { value: "incident", label: "Инцидент" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  status_change: "bg-orange-100 text-orange-800",
  login: "bg-violet-100 text-violet-800",
  logout: "bg-gray-100 text-gray-600",
};

function ActionBadge({ action }: { action: string }) {
  const colorClass = ACTION_COLORS[action.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {action}
    </span>
  );
}

export default function AuditPage() {
  const { success, error: toastError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pageSize = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/audit?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLogs(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки аудит-лога");
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Аудит</h1>
        <p className="text-slate-500 mt-1">Журнал действий в системе</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по действию или ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Действие</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Сущность</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">ID сущности</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Мета</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Записи не найдены
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{log.entityType}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {log.entityId ? log.entityId.slice(0, 12) + "..." : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.actor?.fullName || "Система"}
                        {log.actor?.email && (
                          <span className="block text-xs text-slate-400">{log.actor.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <button className="text-violet-600 text-xs hover:underline">
                            {expandedId === log.id ? "Скрыть" : "Показать"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.meta && (
                      <tr key={`${log.id}-meta`} className="border-b bg-slate-50">
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="text-xs text-slate-600 bg-white border rounded p-3 overflow-x-auto max-h-48">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
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
    </div>
  );
}
