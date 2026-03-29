"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface Tariff {
  id: string;
  name: string;
  pricePerMinCents: number;
  minChargeCents: number;
  roundingMode: string;
  isActive: boolean;
  createdAt: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function centsToRub(cents: number): string {
  return (cents / 100).toFixed(2);
}

function rubToCents(rub: string): number {
  return Math.round(parseFloat(rub) * 100);
}

interface TariffFormData {
  name: string;
  pricePerMinRub: string;
  minChargeRub: string;
  roundingMode: string;
  isActive: boolean;
}

const defaultForm: TariffFormData = {
  name: "",
  pricePerMinRub: "",
  minChargeRub: "",
  roundingMode: "ceil",
  isActive: true,
};

export default function TariffsPage() {
  const { success, error: toastError } = useToast();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TariffFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tariffs", { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTariffs(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      toastError("Ошибка загрузки тарифов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTariffs();
  }, [fetchTariffs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (t: Tariff) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      pricePerMinRub: centsToRub(t.pricePerMinCents),
      minChargeRub: centsToRub(t.minChargeCents),
      roundingMode: t.roundingMode,
      isActive: t.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Обязательное поле";
    if (!form.pricePerMinRub || isNaN(parseFloat(form.pricePerMinRub))) e.pricePerMinRub = "Введите корректную сумму";
    if (!form.minChargeRub || isNaN(parseFloat(form.minChargeRub))) e.minChargeRub = "Введите корректную сумму";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        pricePerMinCents: rubToCents(form.pricePerMinRub),
        minChargeCents: rubToCents(form.minChargeRub),
        roundingMode: form.roundingMode,
        isActive: form.isActive,
      };

      const url = editingId ? `/api/admin/tariffs/${editingId}` : "/api/admin/tariffs";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      await fetchTariffs();
      setModalOpen(false);
    } catch {
      toastError("Ошибка сохранения тарифа");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (t: Tariff) => {
    try {
      const res = await fetch(`/api/admin/tariffs/${t.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      if (!res.ok) throw new Error();
      await fetchTariffs();
    } catch {
      toastError("Ошибка изменения статуса тарифа");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Тарифы</h1>
          <p className="text-slate-500 mt-1">Управление тарифами</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Создать тариф
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Название</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Цена/мин</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Мин. заряд</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Округление</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Создан</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tariffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Тарифы не найдены
                  </td>
                </tr>
              ) : (
                tariffs.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 font-medium">{centsToRub(t.pricePerMinCents)} ₽</td>
                    <td className="px-4 py-3 text-slate-600">{centsToRub(t.minChargeCents)} ₽</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{t.roundingMode}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          t.isActive
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {t.isActive ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(t)}
                          className="gap-1 text-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Изменить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(t)}
                          className={t.isActive ? "text-slate-500" : "text-emerald-600"}
                        >
                          {t.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Редактировать тариф" : "Создать тариф"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Базовый тариф"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Цена за мин. (₽) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.pricePerMinRub}
                  onChange={(e) => setForm((f) => ({ ...f, pricePerMinRub: e.target.value }))}
                  placeholder="8.50"
                />
                {errors.pricePerMinRub && <p className="text-xs text-red-500">{errors.pricePerMinRub}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Мин. списание (₽) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.minChargeRub}
                  onChange={(e) => setForm((f) => ({ ...f, minChargeRub: e.target.value }))}
                  placeholder="50.00"
                />
                {errors.minChargeRub && <p className="text-xs text-red-500">{errors.minChargeRub}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Округление</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.roundingMode}
                onChange={(e) => setForm((f) => ({ ...f, roundingMode: e.target.value }))}
              >
                <option value="ceil">Вверх (ceil)</option>
                <option value="floor">Вниз (floor)</option>
                <option value="round">Обычное (round)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-violet-600"
              />
              <span className="text-sm font-medium">Активен</span>
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
