"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArrowLeft, Save, MapPin } from "lucide-react";
import { useToast } from "@/components/admin/Toast";

interface RefOption {
  id: number | string;
  name: string;
}

interface VehicleState {
  lat?: number;
  lon?: number;
  fuelPercent?: number;
  chargePercent?: number;
  updatedAt?: string;
}

interface StatusHistoryItem {
  id: string;
  prevStatus: string;
  nextStatus: string;
  reason?: string;
  actorUser?: { fullName: string };
  createdAt: string;
}

interface Trip {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  durationMinutes?: number;
  amountCents?: number;
  user?: { id: string; fullName: string };
}

interface Reservation {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  user?: { id: string; fullName: string };
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  year: number;
  status: string;
  photoUrl?: string;
  classId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  baseTariffId?: string;
  defaultZoneId?: string;
  vehicleClass?: { name: string };
  transmission?: { name: string };
  fuelType?: { name: string };
  baseTariff?: { name: string };
  lastState?: VehicleState;
  statusHistory?: StatusHistoryItem[];
  trips?: Trip[];
  reservations?: Reservation[];
}

type Tab = "info" | "trips" | "reservations" | "location";

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

function formatDuration(minutes?: number, start?: string, end?: string) {
  const mins = minutes ?? (start
    ? Math.floor(((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 60000)
    : null);
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}ч ${m}мин` : `${m}мин`;
}

const DESTRUCTIVE_STATUSES = ["blocked"];

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { success, error: toastError } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("info");

  const [tariffs, setTariffs] = useState<RefOption[]>([]);
  const [zones, setZones] = useState<RefOption[]>([]);
  const [classes, setClasses] = useState<RefOption[]>([]);
  const [transmissions, setTransmissions] = useState<RefOption[]>([]);
  const [fuelTypes, setFuelTypes] = useState<RefOption[]>([]);

  const [form, setForm] = useState({
    brand: "",
    model: "",
    plateNumber: "",
    year: "",
    classId: "",
    transmissionId: "",
    fuelTypeId: "",
    baseTariffId: "",
    defaultZoneId: "",
    photoUrl: "",
  });

  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Location tab
  const [locLat, setLocLat] = useState<string>("");
  const [locLon, setLocLon] = useState<string>("");
  const [locSaving, setLocSaving] = useState(false);
  const [ymapsReady, setYmapsReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const ymapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/vehicles/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/tariffs", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/zones", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/vehicles/ref", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ classes: [], transmissions: [], fuelTypes: [] })),
    ]).then(([vehicleData, tariffsData, zonesData, refData]) => {
      setVehicle(vehicleData);
      setLocLat(String(vehicleData.lastState?.lat ?? "55.751244"));
      setLocLon(String(vehicleData.lastState?.lon ?? "37.618423"));
      setForm({
        brand: vehicleData.brand ?? "",
        model: vehicleData.model ?? "",
        plateNumber: vehicleData.plateNumber ?? "",
        year: String(vehicleData.year ?? ""),
        classId: String(vehicleData.classId ?? ""),
        transmissionId: String(vehicleData.transmissionId ?? ""),
        fuelTypeId: String(vehicleData.fuelTypeId ?? ""),
        baseTariffId: vehicleData.baseTariffId ?? "",
        defaultZoneId: vehicleData.defaultZoneId ?? "",
        photoUrl: vehicleData.photoUrl ?? "",
      });
      setTariffs(Array.isArray(tariffsData) ? tariffsData : tariffsData.data ?? []);
      setZones(Array.isArray(zonesData) ? zonesData : zonesData.data ?? []);
      setClasses(refData.classes ?? []);
      setTransmissions(refData.transmissions ?? []);
      setFuelTypes(refData.fuelTypes ?? []);
      setLoading(false);
    });
  }, [id]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}`, {
        method: "PATCH",
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
        else toastError(data.message || "Ошибка сохранения");
        return;
      }
      success("Сохранено успешно");
    } catch {
      toastError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      if (!res.ok) throw new Error();
      const updated = await fetch(`/api/admin/vehicles/${id}`, { credentials: "include" }).then((r) => r.json());
      setVehicle(updated);
      setForm((prev) => ({ ...prev, status: updated.status }));
      setConfirmOpen(false);
      setStatusReason("");
      setNewStatus("");
      success("Статус изменён");
    } catch {
      toastError("Ошибка изменения статуса");
    } finally {
      setStatusLoading(false);
    }
  };

  // Initialize Yandex Map when location tab is active and ymaps is loaded
  useEffect(() => {
    if (tab !== "location" || !ymapsReady || !mapRef.current) return;

    const lat = parseFloat(locLat) || 55.1644;
    const lon = parseFloat(locLon) || 61.4368;
    let destroyed = false;

    (window as any).ymaps.ready(() => {
      if (destroyed || !mapRef.current) return;
      const map = new (window as any).ymaps.Map(mapRef.current, {
        center: [lat, lon],
        zoom: 14,
        controls: ["zoomControl", "fullscreenControl"],
      });

      const marker = new (window as any).ymaps.Placemark(
        [lat, lon],
        { hintContent: `${vehicle?.brand} ${vehicle?.model}` },
        { preset: "islands#violetDotIconWithCaption", draggable: true }
      );

      marker.events.add("dragend", () => {
        const coords = marker.geometry.getCoordinates();
        setLocLat(coords[0].toFixed(6));
        setLocLon(coords[1].toFixed(6));
      });

      map.events.add("click", (e: any) => {
        const coords = e.get("coords");
        marker.geometry.setCoordinates(coords);
        setLocLat(coords[0].toFixed(6));
        setLocLon(coords[1].toFixed(6));
      });

      map.geoObjects.add(marker);
      ymapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      destroyed = true;
      if (ymapInstanceRef.current) {
        ymapInstanceRef.current.destroy();
        ymapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ymapsReady]);

  // Sync marker when inputs change manually
  useEffect(() => {
    if (!markerRef.current) return;
    const lat = parseFloat(locLat);
    const lon = parseFloat(locLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      markerRef.current.geometry.setCoordinates([lat, lon]);
      ymapInstanceRef.current?.setCenter([lat, lon]);
    }
  }, [locLat, locLon]);

  const handleLocationSave = async () => {
    const lat = parseFloat(locLat);
    const lon = parseFloat(locLon);
    if (isNaN(lat) || isNaN(lon)) {
      toastError("Введите корректные координаты");
      return;
    }
    setLocSaving(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/location`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
      });
      if (!res.ok) throw new Error();
      setVehicle((prev) => prev ? { ...prev, lastState: { ...prev.lastState, lat, lon } } : prev);
      success("Местоположение сохранено");
    } catch {
      toastError("Ошибка сохранения координат");
    } finally {
      setLocSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <p className="text-red-500">Автомобиль не найден</p>
        <Link href="/admin/vehicles">
          <Button variant="outline" className="mt-4">Назад</Button>
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "info", label: "Основные данные" },
    { id: "trips", label: "История поездок", count: vehicle.trips?.length },
    { id: "reservations", label: "Бронирования", count: vehicle.reservations?.length },
    { id: "location", label: "Местоположение" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {vehicle.brand} {vehicle.model}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-slate-500">{vehicle.plateNumber}</span>
            <StatusBadge status={vehicle.status} type="vehicle" />
          </div>
        </div>
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

      {/* Info tab */}
      {tab === "info" && (
        <div className="space-y-6">
          <form onSubmit={handleSave}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Основные данные</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Марка</Label>
                  <Input value={form.brand} onChange={(e) => setField("brand", e.target.value)} />
                  {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Модель</Label>
                  <Input value={form.model} onChange={(e) => setField("model", e.target.value)} />
                  {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Номер</Label>
                  <Input
                    value={form.plateNumber}
                    onChange={(e) => setField("plateNumber", e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Год</Label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => setField("year", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Класс</Label>
                  <Select value={form.classId} onValueChange={(v) => setField("classId", v)}>
                    <SelectTrigger><SelectValue placeholder="Класс" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>КПП</Label>
                  <Select value={form.transmissionId} onValueChange={(v) => setField("transmissionId", v)}>
                    <SelectTrigger><SelectValue placeholder="КПП" /></SelectTrigger>
                    <SelectContent>
                      {transmissions.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Топливо</Label>
                  <Select value={form.fuelTypeId} onValueChange={(v) => setField("fuelTypeId", v)}>
                    <SelectTrigger><SelectValue placeholder="Топливо" /></SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Тариф</Label>
                  <Select value={form.baseTariffId} onValueChange={(v) => setField("baseTariffId", v)}>
                    <SelectTrigger><SelectValue placeholder="Тариф" /></SelectTrigger>
                    <SelectContent>
                      {tariffs.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Зона</Label>
                  <Select value={form.defaultZoneId} onValueChange={(v) => setField("defaultZoneId", v)}>
                    <SelectTrigger><SelectValue placeholder="Зона" /></SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>URL фото</Label>
                  <Input
                    value={form.photoUrl}
                    onChange={(e) => setField("photoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Link href="/admin/vehicles">
                    <Button variant="outline">Отмена</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Status change section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Изменить статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Текущий статус:</span>
                <StatusBadge status={vehicle.status} type="vehicle" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Новый статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {["available", "service", "blocked", "reserved", "in_trip"]
                      .filter((s) => s !== vehicle.status)
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          <StatusBadge status={s} type="vehicle" />
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Причина (необязательно)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
                <Button
                  disabled={!newStatus}
                  onClick={() => setConfirmOpen(true)}
                  variant={DESTRUCTIVE_STATUSES.includes(newStatus) ? "destructive" : "default"}
                  className={!DESTRUCTIVE_STATUSES.includes(newStatus) ? "bg-violet-600 hover:bg-violet-700" : ""}
                >
                  Применить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Last state */}
          {vehicle.lastState && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Последнее состояние
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Широта</p>
                  <p className="font-medium">{vehicle.lastState.lat?.toFixed(6) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Долгота</p>
                  <p className="font-medium">{vehicle.lastState.lon?.toFixed(6) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Топливо</p>
                  <p className="font-medium">
                    {vehicle.lastState.fuelPercent != null ? `${vehicle.lastState.fuelPercent}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Заряд</p>
                  <p className="font-medium">
                    {vehicle.lastState.chargePercent != null ? `${vehicle.lastState.chargePercent}%` : "—"}
                  </p>
                </div>
                {vehicle.lastState.updatedAt && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-xs text-slate-500">Обновлено: {formatDate(vehicle.lastState.updatedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status history */}
          {vehicle.statusHistory && vehicle.statusHistory.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">История статусов</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Было</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Стало</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Причина</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Кто изменил</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.statusHistory.map((h) => (
                        <tr key={h.id} className="border-b last:border-0">
                          <td className="px-4 py-3"><StatusBadge status={h.prevStatus} type="vehicle" /></td>
                          <td className="px-4 py-3"><StatusBadge status={h.nextStatus} type="vehicle" /></td>
                          <td className="px-4 py-3 text-slate-600">{h.reason || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{h.actorUser?.fullName || "Система"}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(h.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Начало</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Длит.</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {!vehicle.trips || vehicle.trips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">Поездок нет</td>
                  </tr>
                ) : (
                  vehicle.trips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/trips/${trip.id}`} className="font-mono text-xs text-violet-600 hover:underline">
                          {trip.id.slice(0, 12)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {trip.user ? (
                          <Link href={`/admin/users/${trip.user.id}`} className="text-violet-700 hover:underline font-medium">
                            {trip.user.fullName}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={trip.status} type="trip" /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(trip.startedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDuration(trip.durationMinutes, trip.startedAt, trip.finishedAt)}
                      </td>
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
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Пользователь</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Создано</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Истекает</th>
                </tr>
              </thead>
              <tbody>
                {!vehicle.reservations || vehicle.reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">Бронирований нет</td>
                  </tr>
                ) : (
                  vehicle.reservations.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-violet-600">{r.code}</td>
                      <td className="px-4 py-3">
                        {r.user ? (
                          <Link href={`/admin/users/${r.user.id}`} className="text-violet-700 hover:underline font-medium">
                            {r.user.fullName}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} type="reservation" /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(r.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Location tab */}
      {tab === "location" && (
        <div className="space-y-4">
          <Script
            src={`https://api-maps.yandex.ru/2.1/?apikey=3c34dc81-b06e-4a4b-b07b-12d9405bf147&lang=ru_RU`}
            strategy="afterInteractive"
            onLoad={() => setYmapsReady(true)}
          />
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Разместить автомобиль на карте
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                Нажмите на карту или перетащите маркер, чтобы задать местоположение автомобиля. Затем нажмите «Сохранить».
              </p>
              <div
                ref={mapRef}
                className="w-full rounded-lg overflow-hidden border"
                style={{ height: 420 }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Широта</Label>
                  <Input
                    value={locLat}
                    onChange={(e) => setLocLat(e.target.value)}
                    placeholder="55.751244"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Долгота</Label>
                  <Input
                    value={locLon}
                    onChange={(e) => setLocLon(e.target.value)}
                    placeholder="37.618423"
                  />
                </div>
              </div>
              <Button
                onClick={handleLocationSave}
                disabled={locSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <Save className="h-4 w-4" />
                {locSaving ? "Сохранение..." : "Сохранить местоположение"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Изменить статус автомобиля?"
        description={`Статус будет изменён на «${newStatus}».${statusReason ? ` Причина: ${statusReason}` : ""}`}
        confirmLabel="Изменить"
        variant={DESTRUCTIVE_STATUSES.includes(newStatus) ? "destructive" : "default"}
        onConfirm={handleStatusChange}
        loading={statusLoading}
      />
    </div>
  );
}
