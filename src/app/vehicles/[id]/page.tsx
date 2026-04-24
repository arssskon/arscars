"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass/GlassCard";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { GlassBadge } from "@/components/ui/glass/GlassBadge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import {
  ArrowLeft, Star, Fuel, Zap, Settings2, MapPin, Clock, Shield,
  Check, CreditCard, AlertCircle, Gauge, Timer, Milestone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { ClassBadge, deriveClass } from "@/components/ui/ClassBadge";

type VehicleDetail = VehicleWithDetails & { zoneName?: string | null };

const fuelLabels: Record<string, string> = { petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид" };
const transLabels: Record<string, string> = { AT: "Автомат", MT: "Механика", PDK: "PDK" };
const classLabels: Record<string, string> = { sport: "Спорт", luxury: "Люкс", suv: "Внедорожник", coupe: "Купе", sedan: "Седан" };

const modelSpecs: Record<string, { hp: number; accel: string; top: number }> = {
  "911 Carrera":    { hp: 385,  accel: "4.2", top: 293 },
  "911 GT3":        { hp: 510,  accel: "3.4", top: 318 },
  "911 Carrera S":  { hp: 450,  accel: "3.7", top: 308 },
  "911 GT3 RS":     { hp: 525,  accel: "3.2", top: 296 },
  "Cayenne":        { hp: 340,  accel: "5.9", top: 243 },
  "Cayenne Turbo":  { hp: 550,  accel: "3.9", top: 286 },
  "Panamera":       { hp: 330,  accel: "5.3", top: 260 },
  "Taycan":         { hp: 408,  accel: "5.4", top: 225 },
  "Taycan Turbo S": { hp: 761,  accel: "2.8", top: 260 },
  "Macan":          { hp: 265,  accel: "6.2", top: 232 },
};

const modelDescriptions: Record<string, string> = {
  "911 Carrera":    "Легендарный спорткар с воздушно-оппозитным мотором. Идеальный баланс между ежедневной практичностью и гоночными ощущениями.",
  "911 GT3":        "Гоночный ДНК на дорогах общего пользования. Атмосферный двигатель 4.0 л, задний привод и механика — чистый драйверский экстаз.",
  "911 Carrera S":  "Carrera S добавляет мощности и уверенности. Расширенные крылья, большие тормоза и обострённые ощущения при каждом разгоне.",
  "911 GT3 RS":     "Предел возможного на публичных дорогах. Аэродинамика уровня GT-гонок, активная подвеска и 525 л.с. чистого адреналина.",
  "Cayenne":        "Спортивный SUV, который не делает компромиссов. Динамика спорткара в кузове внедорожника с просторным салоном.",
  "Cayenne Turbo":  "Турбо-мощь и полный привод. Разгон до 100 за 3.9 с, но при этом — комфорт премиум-класса для всей семьи.",
  "Panamera":       "Гранд-туризмо четырёх дверей. Просторный салон, роскошь и спортивная динамика в одном неповторимом облике.",
  "Taycan":         "Будущее началось уже сейчас. Полностью электрический суперкар с мгновенным крутящим моментом и запасом хода 450 км.",
  "Taycan Turbo S": "Вершина электрической эволюции. 761 л.с., разгон до 100 за 2.8 с и роскошный салон — превосходство без компромиссов.",
  "Macan":          "Компактный спортивный SUV с ярким характером. Манёвренный, стремительный и элегантный — идеален для городских приключений.",
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuthStore();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${params.id}`)
      .then((r) => r.json())
      .then((data) => { if (data.error) { setVehicle(null); } else { setVehicle(data); } })
      .catch(() => setVehicle(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleBook = async () => {
    if (!isAuthenticated) { router.push("/login?redirect=/vehicles/" + params.id); return; }
    setBooking(true);
    try {
      const res = await fetch("/api/me/reservations", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vehicleId: params.id }),
      });
      if (res.status === 401) { logout(); router.push("/login?redirect=/vehicles/" + params.id); return; }
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Ошибка бронирования");
        return;
      }
      setShowDialog(false);
      router.push("/trips?booked=true");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "var(--text-secondary)" }}>Загрузка...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          Автомобиль не найден
        </h1>
        <Link href="/search">
          <GlassButton variant="primary">Вернуться</GlassButton>
        </Link>
      </div>
    );
  }

  const price     = vehicle.baseTariff.pricePerMinCents / 100;
  const minCharge = vehicle.baseTariff.minChargeCents / 100;
  const isElectric = vehicle.fuelType.name === "electric" || vehicle.fuelType.name === "hybrid";
  const specs      = modelSpecs[vehicle.model];
  const description = modelDescriptions[vehicle.model];

  return (
    <div className="min-h-screen">
      {/* Back button bar */}
      <div
        style={{
          background: "rgba(240, 236, 248, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(181, 126, 220, 0.15)",
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <GlassButton variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />Назад
          </GlassButton>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Car image */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="relative aspect-video bg-lavender-50">
                {vehicle.photoUrl ? (
                  <Image src={vehicle.photoUrl} alt={vehicle.model} fill className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center text-lavender-300">
                    <Settings2 className="h-24 w-24" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <GlassBadge variant={vehicle.status === "available" ? "success" : "neutral"}>
                    {vehicle.status === "available" ? "Доступен" : "Занят"}
                  </GlassBadge>
                  <GlassBadge variant="lavender">{classLabels[vehicle.vehicleClass.name]}</GlassBadge>
                </div>
              </div>
            </GlassCard>

            {/* Info card */}
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <ClassBadge className={deriveClass(price)} />
                  <h1
                    className="text-3xl font-bold mt-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  {vehicle.year && (
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      {vehicle.year} год
                    </p>
                  )}
                </div>
                {vehicle.rating && (
                  <div className="flex items-center gap-2 bg-lavender-100/60 px-3 py-2 rounded-full">
                    <Star className="h-5 w-5 fill-lavender-400 text-lavender-400" />
                    <span className="font-bold text-lavender-700">{vehicle.rating}</span>
                  </div>
                )}
              </div>

              {description && (
                <p className="mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {description}
                </p>
              )}

              {/* Specs */}
              {specs && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Gauge,     value: specs.hp,       unit: "л.с." },
                    { icon: Timer,     value: `${specs.accel}с`, unit: "0–100 км/ч" },
                    { icon: Milestone, value: specs.top,      unit: "км/ч макс." },
                  ].map(({ icon: Icon, value, unit }) => (
                    <div
                      key={unit}
                      className="p-4 rounded-2xl text-center"
                      style={{ background: "rgba(181,126,220,0.08)", border: "1px solid rgba(181,126,220,0.15)" }}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-2 text-lavender-500" />
                      <p className="text-2xl font-bold text-lavender-600">{value}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{unit}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-4 bg-lavender-100/40" />

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    icon: isElectric ? Zap : Fuel,
                    label: "Топливо",
                    value: fuelLabels[vehicle.fuelType.name],
                    electric: isElectric,
                  },
                  { icon: Settings2, label: "Коробка", value: transLabels[vehicle.transmission.name] },
                  {
                    icon: Fuel,
                    label: isElectric ? "Заряд" : "Топливо",
                    value: `${isElectric ? vehicle.lastState?.chargePercent : vehicle.lastState?.fuelPercent}%`,
                  },
                  { icon: MapPin, label: "Зона", value: vehicle.zoneName ?? "—" },
                ].map(({ icon: Icon, label, value, electric }) => (
                  <div
                    key={label}
                    className="p-4 rounded-xl text-center"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 mx-auto mb-2",
                        electric ? "text-green-500" : "text-lavender-400"
                      )}
                    />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4 bg-lavender-100/40" />

              <div>
                <h3 className="font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                  Включено в аренду
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["КАСКО и ОСАГО", "Помощь 24/7", "Бесплатная парковка", "Топливо"].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span style={{ color: "var(--text-primary)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Bottom widgets row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassPanel title="Расположение">
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <MapPin className="h-4 w-4 text-lavender-400 shrink-0" />
                  <span>{vehicle.zoneName ?? "Центральный район"}</span>
                </div>
              </GlassPanel>

              <GlassPanel title="Тариф">
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {vehicle.baseTariff.name}
                  </p>
                  <p className="text-2xl font-black text-lavender-600">{price} ₽/мин</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    мин. {minCharge} ₽
                  </p>
                </div>
              </GlassPanel>

              <GlassPanel title="Статус">
                <GlassBadge variant={vehicle.status === "available" ? "success" : "neutral"}>
                  {vehicle.status === "available" ? "Доступен" : "Занят"}
                </GlassBadge>
                <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                  {vehicle.status === "available"
                    ? "Готов к бронированию"
                    : "Автомобиль используется"}
                </p>
              </GlassPanel>
            </div>
          </div>

          {/* ── RIGHT: booking panel ── */}
          <div className="lg:col-span-1">
            <GlassPanel floating title="Забронировать" className="sticky top-24">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(181,126,220,0.08)", border: "1px solid rgba(181,126,220,0.15)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>Цена/мин</span>
                    <span className="text-2xl font-black text-lavender-600">{price} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>Минимум</span>
                    <span style={{ color: "var(--text-primary)" }}>от {minCharge} ₽</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-5 w-5 text-lavender-400" />
                    <span style={{ color: "var(--text-primary)" }}>Бронь действует 15 минут</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-5 w-5 text-lavender-400" />
                    <span style={{ color: "var(--text-primary)" }}>Страховка включена</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="h-5 w-5 text-lavender-400" />
                    <span style={{ color: "var(--text-primary)" }}>Оплата по завершении</span>
                  </div>
                </div>

                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full rounded-2xl"
                  disabled={vehicle.status !== "available"}
                  onClick={() => setShowDialog(true)}
                >
                  {vehicle.status === "available" ? "Забронировать" : "Недоступен"}
                </GlassButton>

                {!isAuthenticated && (
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                    <Link href="/login" className="text-lavender-600 hover:underline">Войдите</Link>{" "}
                    для бронирования
                  </p>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass border-0 rounded-3xl">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>Подтверждение</DialogTitle>
            <DialogDescription style={{ color: "var(--text-secondary)" }}>
              Забронировать {vehicle.brand} {vehicle.model}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.5)" }}
            >
              <div className="h-16 w-24 rounded-xl overflow-hidden bg-lavender-50">
                {vehicle.photoUrl && (
                  <Image
                    src={vehicle.photoUrl}
                    alt={vehicle.model}
                    width={96}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-sm text-lavender-600">{price} ₽/мин</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Бронь 15 минут</p>
                <p className="text-amber-700">Подойдите к авто вовремя</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Отмена</Button>
            <GlassButton variant="primary" onClick={handleBook} disabled={booking}>
              {booking ? "..." : "Подтвердить"}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
