"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArrowLeft, Shield, ShieldOff, Save, Pencil, X, FileText, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Trip {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  amountCents?: number;
  vehicle?: { id: string; brand: string; model: string; plateNumber: string };
}

interface Reservation {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  vehicle?: { id: string; brand: string; model: string; plateNumber: string };
}

interface Incident {
  id: string;
  type: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface DriverProfile {
  id: string;
  verificationStatus: string;
  licenseNumber?: string;
}

interface DriverDocument {
  id: string;
  docType: string;
  docSeries?: string;
  docNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: string;
  note?: string;
  createdAt: string;
}

interface UserDetail {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  roles: string[];
  createdAt: string;
  driverProfile?: DriverProfile;
  driverDocuments?: DriverDocument[];
  trips?: Trip[];
  reservations?: Reservation[];
  reportedIncidents?: Incident[];
}

const ALL_ROLES = ["driver", "support", "admin"];
const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  support: "Поддержка",
  driver: "Водитель",
};

type Tab = "profile" | "documents" | "trips" | "reservations" | "incidents";

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Паспорт РФ",
  driver_license: "Водительское удостоверение",
};

const DOC_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:    { label: "Не загружен", className: "bg-slate-100 text-slate-600" },
  pending:  { label: "На проверке", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Подтверждён", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонён",    className: "bg-red-100 text-red-700" },
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

function formatAmount(cents?: number) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("ru-RU") + " ₽";
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { success, error: toastError } = useToast();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");

  // Block/unblock
  const [confirmState, setConfirmState] = useState<"block" | "unblock" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Edit basic info
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Document actions
  const [docActionLoading, setDocActionLoading] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/users/${id}`, { credentials: "include" }).then((r) => r.json());
      setUser(data);
      setSelectedRoles(data.roles ?? []);
      setEditForm({
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
      });
    } catch {
      toastError("Ошибка загрузки пользователя");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleStatusChange = async () => {
    if (!confirmState || !user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmState === "block" ? "blocked" : "active" }),
      });
      if (!res.ok) throw new Error();
      await fetchUser();
      setConfirmState(null);
      success(confirmState === "block" ? "Пользователь заблокирован" : "Пользователь разблокирован");
    } catch {
      toastError("Ошибка изменения статуса");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRolesSave = async () => {
    setRolesLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/roles`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      });
      if (!res.ok) throw new Error();
      await fetchUser();
      success("Роли обновлены");
    } catch {
      toastError("Ошибка обновления ролей");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      await fetchUser();
      setEditing(false);
      success("Данные обновлены");
    } catch {
      toastError("Ошибка сохранения данных");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDocAction = async (docId: string, action: "approve" | "reject") => {
    setDocActionLoading(docId);
    try {
      const note = rejectNote[docId] || undefined;
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error();
      await fetchUser();
      setRejectingId(null);
      setRejectNote((p) => { const n = { ...p }; delete n[docId]; return n; });
      success(action === "approve" ? "Документ подтверждён" : "Документ отклонён");
    } catch {
      toastError("Ошибка при обработке документа");
    } finally {
      setDocActionLoading(null);
    }
  };

  const handleDocDelete = async (docId: string) => {
    setDocActionLoading(docId);
    try {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setDeleteConfirmId(null);
      await fetchUser();
      success("Документ удалён");
    } catch {
      toastError("Ошибка удаления документа");
    } finally {
      setDocActionLoading(null);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
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

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-red-500">Пользователь не найден</p>
        <Link href="/admin/users">
          <Button variant="outline" className="mt-4">Назад</Button>
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "profile", label: "Профиль" },
    { id: "documents", label: "Документы", count: user.driverDocuments?.length },
    { id: "trips", label: "Поездки", count: user.trips?.length },
    { id: "reservations", label: "Бронирования", count: user.reservations?.length },
    { id: "incidents", label: "Инциденты", count: user.reportedIncidents?.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={user.status} type="user" />
            {user.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 text-xs font-medium"
              >
                {ROLE_LABELS[role] ?? role}
              </span>
            ))}
          </div>
        </div>
        {user.status === "active" ? (
          <Button variant="destructive" onClick={() => setConfirmState("block")} className="gap-2">
            <ShieldOff className="h-4 w-4" />
            Заблокировать
          </Button>
        ) : user.status === "blocked" ? (
          <Button onClick={() => setConfirmState("unblock")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Shield className="h-4 w-4" />
            Разблокировать
          </Button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="space-y-6">
          {/* Basic info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Основная информация</CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Редактировать
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5 text-slate-500">
                  <X className="h-3.5 w-3.5" />
                  Отмена
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Имя</Label>
                      <Input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Телефон</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Адрес</Label>
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleEditSave}
                    disabled={editLoading}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editLoading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Имя</p>
                    <p className="font-medium">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium">{user.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Телефон</p>
                    <p className="font-medium">{user.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Адрес</p>
                    <p className="font-medium">{user.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Зарегистрирован</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">ID</p>
                    <p className="font-mono text-xs text-slate-600">{user.id}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Роли</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
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
              <Button
                onClick={handleRolesSave}
                disabled={rolesLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <Save className="h-4 w-4" />
                {rolesLoading ? "Сохранение..." : "Сохранить роли"}
              </Button>
            </CardContent>
          </Card>

          {/* Driver profile */}
          {user.driverProfile && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Профиль водителя</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Статус верификации</p>
                  <p className="font-medium capitalize">{user.driverProfile.verificationStatus}</p>
                </div>
                {user.driverProfile.licenseNumber && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Номер прав</p>
                    <p className="font-mono font-medium">{user.driverProfile.licenseNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Documents tab */}
      {tab === "documents" && (
        <div className="space-y-4">
          {!user.driverDocuments || user.driverDocuments.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                Документы не загружены
              </CardContent>
            </Card>
          ) : (
            user.driverDocuments.map((doc) => {
              const statusInfo = DOC_STATUS_LABELS[doc.status] ?? DOC_STATUS_LABELS.draft;
              const isRejecting = rejectingId === doc.id;
              const isLoading = docActionLoading === doc.id;
              return (
                <Card key={doc.id} className="shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {doc.docSeries && (
                        <div><p className="text-xs text-slate-400 mb-0.5">Серия</p><p className="font-medium">{doc.docSeries}</p></div>
                      )}
                      {doc.docNumber && (
                        <div><p className="text-xs text-slate-400 mb-0.5">Номер</p><p className="font-medium">{doc.docNumber}</p></div>
                      )}
                      {doc.issueDate && (
                        <div><p className="text-xs text-slate-400 mb-0.5">Дата выдачи</p><p className="font-medium">{new Date(doc.issueDate).toLocaleDateString("ru-RU")}</p></div>
                      )}
                      {doc.expiryDate && (
                        <div><p className="text-xs text-slate-400 mb-0.5">Срок действия</p><p className="font-medium">{new Date(doc.expiryDate).toLocaleDateString("ru-RU")}</p></div>
                      )}
                    </div>
                    {doc.fileUrl && (
                      (() => {
                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.fileUrl!);
                        return isImage ? (
                          <div className="rounded-lg overflow-hidden border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={doc.fileUrl} alt="Документ" className="w-full max-h-56 object-contain bg-slate-50" />
                          </div>
                        ) : (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded bg-slate-50 border text-sm hover:bg-slate-100 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 underline">Открыть PDF</span>
                          </a>
                        );
                      })()
                    )}
                    {doc.note && (
                      <div className="p-2 rounded bg-red-50 border border-red-200 text-sm text-red-700">
                        <strong>Причина:</strong> {doc.note}
                      </div>
                    )}
                    {doc.status === "pending" && (
                      <div className="flex flex-col gap-2 pt-1">
                        {isRejecting ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Причина отклонения (необязательно)"
                              value={rejectNote[doc.id] || ""}
                              onChange={(e) => setRejectNote((p) => ({ ...p, [doc.id]: e.target.value }))}
                              rows={2}
                              className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isLoading}
                                onClick={() => handleDocAction(doc.id, "reject")}
                                className="gap-1.5"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                {isLoading ? "Отклонение..." : "Подтвердить отклонение"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRejectingId(null)}
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleDocAction(doc.id, "approve")}
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {isLoading ? "..." : "Подтвердить"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingId(doc.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {doc.status !== "pending" && (
                      <div className="pt-1">
                        {deleteConfirmId === doc.id ? (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700 flex-1">Удалить документ? Это необратимо.</p>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isLoading}
                              onClick={() => handleDocDelete(doc.id)}
                              className="gap-1.5 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {isLoading ? "Удаление..." : "Удалить"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="shrink-0">
                              Отмена
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isLoading}
                            onClick={() => setDeleteConfirmId(doc.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Удалить
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Trips tab */}
      {tab === "trips" && (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Начало</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {!user.trips || user.trips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">Поездок нет</td>
                  </tr>
                ) : (
                  user.trips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/trips/${trip.id}`} className="font-mono text-xs text-violet-600 hover:underline">
                          {trip.id.slice(0, 12)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {trip.vehicle
                          ? `${trip.vehicle.brand} ${trip.vehicle.model} · ${trip.vehicle.plateNumber}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trip.status} type="trip" />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(trip.startedAt)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatAmount(trip.amountCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Reservations tab */}
      {tab === "reservations" && (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Код</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Создано</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Истекает</th>
                </tr>
              </thead>
              <tbody>
                {!user.reservations || user.reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">Бронирований нет</td>
                  </tr>
                ) : (
                  user.reservations.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-violet-600">{r.code}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.vehicle
                          ? `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.plateNumber}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} type="reservation" />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(r.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Incidents tab */}
      {tab === "incidents" && (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Тип</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Описание</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                </tr>
              </thead>
              <tbody>
                {!user.reportedIncidents || user.reportedIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">Инцидентов нет</td>
                  </tr>
                ) : (
                  user.reportedIncidents.map((inc) => (
                    <tr key={inc.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <StatusBadge status={inc.type} type="incidentType" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inc.status} type="incidentStatus" />
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{inc.description || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(inc.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => !o && setConfirmState(null)}
        title={confirmState === "block" ? "Заблокировать пользователя?" : "Разблокировать пользователя?"}
        description={
          confirmState === "block"
            ? "Пользователь потеряет доступ к сервису."
            : "Пользователь снова получит доступ к сервису."
        }
        confirmLabel={confirmState === "block" ? "Заблокировать" : "Разблокировать"}
        variant={confirmState === "block" ? "destructive" : "default"}
        onConfirm={handleStatusChange}
        loading={actionLoading}
      />
    </div>
  );
}
