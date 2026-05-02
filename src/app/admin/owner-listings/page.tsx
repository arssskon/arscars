"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/admin/Toast";
import { CheckCircle, XCircle, PauseCircle, Eye, Filter } from "lucide-react";

interface Listing {
  id: string; make: string; model: string; year: number; plateNumber: string;
  vehicleClass: string; pricePerMinute: number; status: string;
  photoUrls: string[]; description: string | null; ownerPhone: string;
  address: string | null; rejectReason: string | null;
  transmission: string; fuelType: string; color: string;
  latitude: number | null; longitude: number | null;
  createdAt: string;
  user: { fullName: string; email: string | null; phone: string | null };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "На модерации", APPROVED: "Одобрено", REJECTED: "Отклонено", SUSPENDED: "Приостановлено",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "default", APPROVED: "secondary", REJECTED: "destructive", SUSPENDED: "outline",
};
const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
const STATUS_OPTION_LABELS: Record<string, string> = {
  "": "Все", PENDING: "На модерации", APPROVED: "Одобрено", REJECTED: "Отклонено", SUSPENDED: "Приостановлено",
};

export default function AdminOwnerListingsPage() {
  const { success, error: toastError } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewListing, setViewListing] = useState<Listing | null>(null);
  const [actionDialog, setActionDialog] = useState<{ listing: Listing; action: "approve" | "reject" | "suspend" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/admin/owner-listings${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.data)) setListings(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!actionDialog) return;
    const { listing, action } = actionDialog;
    if (action === "reject" && !rejectReason.trim()) { toastError("Введите причину отказа"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/owner-listings/${listing.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectReason: rejectReason || undefined }),
      });
      if (!res.ok) { const d = await res.json(); toastError(d.error || "Ошибка"); return; }
      success(action === "approve" ? "Одобрено" : action === "reject" ? "Отклонено" : "Приостановлено");
      setActionDialog(null);
      setRejectReason("");
      load();
    } catch {
      toastError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Объявления владельцев</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_OPTION_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Заявки</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Загрузка...</div>
          ) : listings.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Нет заявок</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Владелец</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Автомобиль</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Класс</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">₽/мин</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Статус</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Дата</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{l.user.fullName}</div>
                        <div className="text-xs text-slate-400">{l.user.email || l.user.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.make} {l.model}</div>
                        <div className="text-xs text-slate-400">{l.plateNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{l.vehicleClass}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{l.pricePerMinute}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[l.status]}>{STATUS_LABELS[l.status] ?? l.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(l.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewListing(l)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {l.status === "PENDING" && (
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setActionDialog({ listing: l, action: "approve" })}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(l.status === "PENDING" || l.status === "APPROVED") && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => { setRejectReason(""); setActionDialog({ listing: l, action: "reject" }); }}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {l.status === "APPROVED" && (
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700"
                              onClick={() => setActionDialog({ listing: l, action: "suspend" })}>
                              <PauseCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!viewListing} onOpenChange={(o) => { if (!o) setViewListing(null); }}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {viewListing && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{viewListing.make} {viewListing.model} {viewListing.year}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                {/* Photos gallery */}
                {viewListing.photoUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {viewListing.photoUrls.map((url, i) => (
                      <div key={i} className="relative h-24 w-36 rounded-lg overflow-hidden bg-slate-100">
                        <Image src={url} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Владелец", viewListing.user.fullName],
                    ["Телефон", viewListing.ownerPhone],
                    ["Email/Phone", viewListing.user.email || viewListing.user.phone || "—"],
                    ["Госномер", viewListing.plateNumber],
                    ["Цвет", viewListing.color],
                    ["Класс", viewListing.vehicleClass],
                    ["КПП", viewListing.transmission],
                    ["Топливо", viewListing.fuelType],
                    ["Цена/мин", `${viewListing.pricePerMinute} ₽`],
                    ["Адрес", viewListing.address ?? "—"],
                    ["Координаты", viewListing.latitude ? `${viewListing.latitude}, ${viewListing.longitude}` : "—"],
                    ["Статус", STATUS_LABELS[viewListing.status] ?? viewListing.status],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{k}</div>
                      <div className="font-medium text-slate-800 mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                {viewListing.description && (
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Описание</div>
                    <p className="text-sm text-slate-700">{viewListing.description}</p>
                  </div>
                )}
                {viewListing.rejectReason && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="text-xs text-red-600 font-medium mb-1">Причина отказа</div>
                    <p className="text-sm text-red-800">{viewListing.rejectReason}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Action dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) { setActionDialog(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" && "Одобрить заявку?"}
              {actionDialog?.action === "reject" && "Отклонить заявку"}
              {actionDialog?.action === "suspend" && "Приостановить?"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "approve" && "Автомобиль будет добавлен в каталог и появится на карте."}
              {actionDialog?.action === "suspend" && "Автомобиль будет скрыт из каталога."}
            </DialogDescription>
          </DialogHeader>
          {actionDialog?.action === "reject" && (
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none"
              rows={3}
              placeholder="Укажите причину отказа..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setActionDialog(null); setRejectReason(""); }}>Отмена</Button>
            <Button
              variant={actionDialog?.action === "approve" ? "default" : "destructive"}
              disabled={submitting}
              onClick={handleAction}
            >
              {submitting ? "..." : actionDialog?.action === "approve" ? "Одобрить" : actionDialog?.action === "reject" ? "Отклонить" : "Приостановить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
