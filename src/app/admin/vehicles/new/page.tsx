"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/admin/Toast";

interface RefOption {
  id: number | string;
  name: string;
}

interface FormData {
  brand: string;
  model: string;
  plateNumber: string;
  year: string;
  classId: string;
  transmissionId: string;
  fuelTypeId: string;
  baseTariffId: string;
  defaultZoneId: string;
  photoUrl: string;
  status: string;
}

export default function NewVehiclePage() {
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [tariffs, setTariffs] = useState<RefOption[]>([]);
  const [zones, setZones] = useState<RefOption[]>([]);
  const [classes, setClasses] = useState<RefOption[]>([]);
  const [transmissions, setTransmissions] = useState<RefOption[]>([]);
  const [fuelTypes, setFuelTypes] = useState<RefOption[]>([]);

  const [form, setForm] = useState<FormData>({
    brand: "Porsche",
    model: "",
    plateNumber: "",
    year: String(new Date().getFullYear()),
    classId: "",
    transmissionId: "",
    fuelTypeId: "",
    baseTariffId: "",
    defaultZoneId: "",
    photoUrl: "",
    status: "available",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/tariffs", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/zones", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/vehicles/ref", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ classes: [], transmissions: [], fuelTypes: [] })),
    ]).then(([tariffsData, zonesData, refData]) => {
      setTariffs(Array.isArray(tariffsData) ? tariffsData : tariffsData.data ?? []);
      setZones(Array.isArray(zonesData) ? zonesData : zonesData.data ?? []);
      setClasses(refData.classes ?? []);
      setTransmissions(refData.transmissions ?? []);
      setFuelTypes(refData.fuelTypes ?? []);
    });
  }, []);

  const setField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.brand.trim()) newErrors.brand = "Обязательное поле";
    if (!form.model.trim()) newErrors.model = "Обязательное поле";
    if (!form.plateNumber.trim()) newErrors.plateNumber = "Обязательное поле";
    if (!form.year || isNaN(Number(form.year))) newErrors.year = "Введите корректный год";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          classId: form.classId ? Number(form.classId) : undefined,
          transmissionId: form.transmissionId ? Number(form.transmissionId) : undefined,
          fuelTypeId: form.fuelTypeId ? Number(form.fuelTypeId) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) setErrors(data.errors);
        else toastError(data.message || "Ошибка создания автомобиля");
        return;
      }

      router.push("/admin/vehicles");
    } catch {
      toastError("Ошибка создания автомобиля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Добавить автомобиль</h1>
          <p className="text-slate-500 mt-0.5">Заполните данные нового автомобиля</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Основные данные</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Марка *</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                placeholder="Porsche"
              />
              {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="model">Модель *</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
                placeholder="Taycan"
              />
              {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plate">Номер *</Label>
              <Input
                id="plate"
                value={form.plateNumber}
                onChange={(e) => setField("plateNumber", e.target.value.toUpperCase())}
                placeholder="А123БВ777"
              />
              {errors.plateNumber && <p className="text-xs text-red-500">{errors.plateNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year">Год выпуска *</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="2024"
                min="2000"
                max="2030"
              />
              {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Класс</Label>
              <Select value={form.classId} onValueChange={(v) => setField("classId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Коробка передач</Label>
              <Select value={form.transmissionId} onValueChange={(v) => setField("transmissionId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите КПП" />
                </SelectTrigger>
                <SelectContent>
                  {transmissions.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Тип топлива</Label>
              <Select value={form.fuelTypeId} onValueChange={(v) => setField("fuelTypeId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип топлива" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Статус</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="service">Сервис</SelectItem>
                  <SelectItem value="blocked">Заблокирован</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Тариф и зона</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Базовый тариф</Label>
              <Select value={form.baseTariffId} onValueChange={(v) => setField("baseTariffId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {tariffs.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Зона по умолчанию</Label>
              <Select value={form.defaultZoneId} onValueChange={(v) => setField("defaultZoneId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите зону" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Медиа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="photoUrl">URL фотографии</Label>
              <Input
                id="photoUrl"
                value={form.photoUrl}
                onChange={(e) => setField("photoUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Сохранение..." : "Создать автомобиль"}
          </Button>
          <Link href="/admin/vehicles">
            <Button variant="outline">Отмена</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
