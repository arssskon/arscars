"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Zone {
  id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radiusM: number;
  canFinish: boolean;
  outOfZoneFeeCents: number;
  note?: string;
  _count?: { vehicles: number };
}

interface ZoneFormData {
  name: string;
  centerLat: string;
  centerLon: string;
  radiusM: string;
  canFinish: boolean;
  outOfZoneFeeRub: string;
  note: string;
}

const defaultForm: ZoneFormData = {
  name: "",
  centerLat: "",
  centerLon: "",
  radiusM: "",
  canFinish: true,
  outOfZoneFeeRub: "",
  note: "",
};

function centsToRub(cents: number): string {
  return (cents / 100).toFixed(2);
}

function rubToCents(rub: string): number {
  return Math.round(parseFloat(rub) * 100);
}

export default function ZonesPage() {
  const { success, error: toastError } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/zones", { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setZones(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      toastError("Ошибка загрузки зон");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (z: Zone) => {
    setEditingId(z.id);
    setForm({
      name: z.name,
      centerLat: String(z.centerLat),
      centerLon: String(z.centerLon),
      radiusM: String(z.radiusM),
      canFinish: z.canFinish,
      outOfZoneFeeRub: centsToRub(z.outOfZoneFeeCents),
      note: z.note ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Обязательное поле";
    if (!form.centerLat || isNaN(parseFloat(form.centerLat))) e.centerLat = "Введите координату";
    if (!form.centerLon || isNaN(parseFloat(form.centerLon))) e.centerLon = "Введите координату";
    if (!form.radiusM || isNaN(parseFloat(form.radiusM))) e.radiusM = "Введите радиус";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        centerLat: parseFloat(form.centerLat),
        centerLon: parseFloat(form.centerLon),
        radiusM: parseFloat(form.radiusM),
        canFinish: form.canFinish,
        outOfZoneFeeCents: form.outOfZoneFeeRub ? rubToCents(form.outOfZoneFeeRub) : 0,
        note: form.note || undefined,
      };

      const url = editingId ? `/api/admin/zones/${editingId}` : "/api/admin/zones";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      await fetchZones();
      setModalOpen(false);
    } catch {
      toastError("Ошибка сохранения зоны");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Зоны</h1>
          <p className="text-slate-500 mt-1">Управление зонами обслуживания</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Создать зону
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Название</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Центр (lat, lon)</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Радиус, м</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Завершение</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Штраф вне зоны</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Авто</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Заметка</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Зоны не найдены
                  </td>
                </tr>
              ) : (
                zones.map((z) => (
                  <tr key={z.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{z.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {z.centerLat.toFixed(4)}, {z.centerLon.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{z.radiusM.toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          z.canFinish
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {z.canFinish ? "Разрешено" : "Запрещено"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {z.outOfZoneFeeCents > 0 ? `${centsToRub(z.outOfZoneFeeCents)} ₽` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{z._count?.vehicles ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{z.note || "—"}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(z)}
                        className="gap-1 text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Изменить
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Редактировать зону" : "Создать зону"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Центральный район"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Широта центра *</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={form.centerLat}
                  onChange={(e) => setForm((f) => ({ ...f, centerLat: e.target.value }))}
                  placeholder="55.7558"
                />
                {errors.centerLat && <p className="text-xs text-red-500">{errors.centerLat}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Долгота центра *</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={form.centerLon}
                  onChange={(e) => setForm((f) => ({ ...f, centerLon: e.target.value }))}
                  placeholder="37.6173"
                />
                {errors.centerLon && <p className="text-xs text-red-500">{errors.centerLon}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Радиус (м) *</Label>
                <Input
                  type="number"
                  value={form.radiusM}
                  onChange={(e) => setForm((f) => ({ ...f, radiusM: e.target.value }))}
                  placeholder="10000"
                />
                {errors.radiusM && <p className="text-xs text-red-500">{errors.radiusM}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Штраф вне зоны (₽)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.outOfZoneFeeRub}
                  onChange={(e) => setForm((f) => ({ ...f, outOfZoneFeeRub: e.target.value }))}
                  placeholder="500.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Заметка</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Дополнительная информация"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canFinish}
                onChange={(e) => setForm((f) => ({ ...f, canFinish: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-violet-600"
              />
              <span className="text-sm font-medium">Разрешить завершение поездки в зоне</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
