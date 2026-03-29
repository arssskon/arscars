"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock, User, Trash2 } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface DocWithUser {
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
  owner: { id: string; fullName: string; email?: string; phone?: string };
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Паспорт РФ",
  driver_license: "Водительское удостоверение",
};

const STATUS_FILTERS = [
  { value: "pending",  label: "На проверке" },
  { value: "approved", label: "Подтверждённые" },
  { value: "rejected", label: "Отклонённые" },
  { value: "all",      label: "Все" },
];

export default function AdminDocumentsPage() {
  const { success, error: toastError } = useToast();
  const [docs, setDocs] = useState<DocWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/documents?status=${filter}`, { credentials: "include" }).then((r) => r.json());
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      toastError("Ошибка загрузки документов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [filter]);

  const handleAction = async (docId: string, action: "approve" | "reject") => {
    setActionLoading(docId);
    try {
      const note = rejectNote[docId] || undefined;
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) throw new Error();
      await fetchDocs();
      setRejectingId(null);
      setRejectNote((p) => { const n = { ...p }; delete n[docId]; return n; });
      success(action === "approve" ? "Документ подтверждён" : "Документ отклонён");
    } catch {
      toastError("Ошибка при обработке документа");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (docId: string) => {
    setActionLoading(docId);
    try {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setDeleteConfirmId(null);
      await fetchDocs();
      success("Документ удалён");
    } catch {
      toastError("Ошибка удаления документа");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Документы</h1>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Нет документов</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => {
            const isRejecting = rejectingId === doc.id;
            const isLoading = actionLoading === doc.id;
            return (
              <Card key={doc.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          <Link
                            href={`/admin/users/${doc.owner.id}`}
                            className="hover:text-violet-600 hover:underline font-medium"
                          >
                            {doc.owner.fullName}
                          </Link>
                          {(doc.owner.email || doc.owner.phone) && (
                            <span className="text-slate-400">· {doc.owner.email || doc.owner.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.status === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-xs font-medium">
                          <Clock className="h-3 w-3" />На проверке
                        </span>
                      )}
                      {doc.status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />Подтверждён
                        </span>
                      )}
                      {doc.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-medium">
                          <XCircle className="h-3 w-3" />Отклонён
                        </span>
                      )}
                    </div>
                  </div>
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
                    <div><p className="text-xs text-slate-400 mb-0.5">Загружен</p><p className="font-medium">{new Date(doc.createdAt).toLocaleDateString("ru-RU")}</p></div>
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
                      <strong>Причина отклонения:</strong> {doc.note}
                    </div>
                  )}
                  {doc.status === "pending" && (
                    <div className="pt-1">
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
                              onClick={() => handleAction(doc.id, "reject")}
                              className="gap-1.5"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              {isLoading ? "Отклонение..." : "Подтвердить отклонение"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleAction(doc.id, "approve")}
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
                          <p className="text-sm text-red-700 flex-1">Удалить документ? Это действие необратимо.</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isLoading}
                            onClick={() => handleDelete(doc.id)}
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
          })}
        </div>
      )}
    </div>
  );
}
