"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import { Search, Eye, ShieldOff, Shield, Pencil, Save, UserCog } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  roles: string[];
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активен" },
  { value: "blocked", label: "Заблокирован" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "Все роли" },
  { value: "admin", label: "Администратор" },
  { value: "support", label: "Поддержка" },
  { value: "driver", label: "Водитель" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  support: "Поддержка",
  driver: "Водитель",
};

const ALL_ROLES = ["driver", "support", "admin"];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function UsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Block/Unblock confirm
  const [confirmState, setConfirmState] = useState<{ userId: string; action: "block" | "unblock" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit roles modal
  const [rolesModal, setRolesModal] = useState<{ user: User } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setUsers(json.data ?? json);
      setTotal(json.total ?? (json.data ?? json).length);
    } catch {
      toastError("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async () => {
    if (!confirmState) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmState.userId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmState.action === "block" ? "blocked" : "active" }),
      });
      if (!res.ok) throw new Error();
      await fetchUsers();
      setConfirmState(null);
      success(confirmState.action === "block" ? "Пользователь заблокирован" : "Пользователь разблокирован");
    } catch {
      toastError("Ошибка изменения статуса");
    } finally {
      setActionLoading(false);
    }
  };

  const openRolesModal = (user: User) => {
    setRolesModal({ user });
    setSelectedRoles([...user.roles]);
  };

  const handleRolesSave = async () => {
    if (!rolesModal) return;
    setRolesLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${rolesModal.user.id}/roles`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      });
      if (!res.ok) throw new Error();
      await fetchUsers();
      setRolesModal(null);
      success("Роли обновлены");
    } catch {
      toastError("Ошибка обновления ролей");
    } finally {
      setRolesLoading(false);
    }
  };

  const toggleRole = (role: string) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>
        <p className="text-slate-500 mt-1">Управление пользователями · {total} чел.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по имени, email или телефону..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
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
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
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
                <th className="text-left px-4 py-3 font-medium text-slate-500">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Контакты</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Роли</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Зарег.</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {u.email && <p>{u.email}</p>}
                      {u.phone && <p className="text-slate-400">{u.phone}</p>}
                      {!u.email && !u.phone && "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} type="user" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-slate-400 text-xs">—</span>
                        ) : (
                          u.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 text-xs font-medium"
                            >
                              {ROLE_LABELS[role] ?? role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* View detail */}
                        <Link href={`/admin/users/${u.id}`}>
                          <Button variant="outline" size="sm" className="gap-1 h-8">
                            <Eye className="h-3 w-3" />
                            Профиль
                          </Button>
                        </Link>

                        {/* Edit roles */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8 text-violet-600 border-violet-200 hover:bg-violet-50"
                          onClick={() => openRolesModal(u)}
                        >
                          <UserCog className="h-3 w-3" />
                          Роли
                        </Button>

                        {/* Block/Unblock */}
                        {u.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setConfirmState({ userId: u.id, action: "block" })}
                          >
                            <ShieldOff className="h-3 w-3" />
                            Блок
                          </Button>
                        ) : u.status === "blocked" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setConfirmState({ userId: u.id, action: "unblock" })}
                          >
                            <Shield className="h-3 w-3" />
                            Разблок
                          </Button>
                        ) : null}
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

      {/* Roles edit modal */}
      <Dialog open={!!rolesModal} onOpenChange={(o) => !o && setRolesModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Роли · {rolesModal?.user.fullName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {ALL_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesModal(null)}>Отмена</Button>
            <Button
              onClick={handleRolesSave}
              disabled={rolesLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              {rolesLoading ? "Сохранение..." : "Сохранить роли"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => !o && setConfirmState(null)}
        title={confirmState?.action === "block" ? "Заблокировать пользователя?" : "Разблокировать пользователя?"}
        description={confirmState?.action === "block"
          ? "Пользователь не сможет использовать сервис."
          : "Пользователь снова получит доступ к сервису."}
        confirmLabel={confirmState?.action === "block" ? "Заблокировать" : "Разблокировать"}
        variant={confirmState?.action === "block" ? "destructive" : "default"}
        onConfirm={handleStatusChange}
        loading={actionLoading}
      />
    </div>
  );
}
