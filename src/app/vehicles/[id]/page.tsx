"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import { ArrowLeft, Star, Fuel, Zap, Settings2, MapPin, Clock, Shield, Check, CreditCard, AlertCircle, Gauge, Timer, Milestone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleWithDetails } from "@/lib/mock-data";

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
  "Taycan":         "Будущее началось уже сейчас. Полностью электрический суперкар Porsche с мгновенным крутящим моментом и запасом хода 450 км.",
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
      .then((data) => {
        if (data.error) { setVehicle(null); } else { setVehicle(data); }
      })
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
      if (res.status === 401) {
        logout();
        router.push("/login?redirect=/vehicles/" + params.id);
        return;
      }
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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Автомобиль не найден</h1>
        <Link href="/search"><Button>Вернуться</Button></Link>
      </div>
    );
  }

  const price = vehicle.baseTariff.pricePerMinCents / 100;
  const minCharge = vehicle.baseTariff.minChargeCents / 100;
  const isElectric = vehicle.fuelType.name === "electric" || vehicle.fuelType.name === "hybrid";
  const specs = modelSpecs[vehicle.model];
  const description = modelDescriptions[vehicle.model];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />Назад
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
                {vehicle.photoUrl ? (
                  <Image src={vehicle.photoUrl} alt={vehicle.model} fill className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Settings2 className="h-24 w-24" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={cn(vehicle.status === "available" ? "bg-green-500" : "bg-muted text-muted-foreground")}>
                    {vehicle.status === "available" ? "Доступен" : "Занят"}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    {classLabels[vehicle.vehicleClass.name]}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{vehicle.brand} {vehicle.model}</CardTitle>
                    {vehicle.year && <p className="text-muted-foreground mt-1">{vehicle.year} год</p>}
                  </div>
                  {vehicle.rating && (
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-full">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="font-bold text-primary">{vehicle.rating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}

                {specs && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <Gauge className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{specs.hp}</p>
                      <p className="text-xs text-muted-foreground mt-1">л.с.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <Timer className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{specs.accel}с</p>
                      <p className="text-xs text-muted-foreground mt-1">0–100 км/ч</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <Milestone className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{specs.top}</p>
                      <p className="text-xs text-muted-foreground mt-1">км/ч макс.</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    {isElectric ? <Zap className="h-6 w-6 mx-auto mb-2 text-green-600" /> : <Fuel className="h-6 w-6 mx-auto mb-2 text-primary" />}
                    <p className="text-sm text-muted-foreground">Топливо</p>
                    <p className="font-semibold">{fuelLabels[vehicle.fuelType.name]}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Settings2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Коробка</p>
                    <p className="font-semibold">{transLabels[vehicle.transmission.name]}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Fuel className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">{isElectric ? "Заряд" : "Топливо"}</p>
                    <p className="font-semibold">
                      {isElectric ? vehicle.lastState?.chargePercent : vehicle.lastState?.fuelPercent}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Зона</p>
                    <p className="font-semibold">{vehicle.zoneName ?? "—"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-4">Включено в аренду</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["КАСКО и ОСАГО", "Помощь 24/7", "Бесплатная парковка", "Топливо"].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Тариф «{vehicle.baseTariff.name}»</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Стоимость минуты</p>
                    <p className="text-3xl font-bold text-primary">{price} ₽</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Минимум</p>
                    <p className="text-xl font-semibold">{minCharge} ₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader><CardTitle>Забронировать</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Цена/мин</span>
                    <span className="text-2xl font-bold text-primary">{price} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Минимум</span>
                    <span>от {minCharge} ₽</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm"><Clock className="h-5 w-5 text-primary" /><span>Бронь действует 15 минут</span></div>
                  <div className="flex items-center gap-3 text-sm"><Shield className="h-5 w-5 text-primary" /><span>Страховка включена</span></div>
                  <div className="flex items-center gap-3 text-sm"><CreditCard className="h-5 w-5 text-primary" /><span>Оплата по завершении</span></div>
                </div>
                <Button
                  className="w-full h-12 text-lg lavender-gradient text-white hover:opacity-90"
                  disabled={vehicle.status !== "available"}
                  onClick={() => setShowDialog(true)}
                >
                  {vehicle.status === "available" ? "Забронировать" : "Недоступен"}
                </Button>
                {!isAuthenticated && (
                  <p className="text-sm text-center text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline">Войдите</Link> для бронирования
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение</DialogTitle>
            <DialogDescription>Забронировать {vehicle.brand} {vehicle.model}?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted">
                {vehicle.photoUrl && (
                  <Image src={vehicle.photoUrl} alt={vehicle.model} width={96} height={64} className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-muted-foreground">{price} ₽/мин</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Бронь 15 минут</p>
                <p className="text-yellow-700">Подойдите к авто вовремя</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Отмена</Button>
            <Button onClick={handleBook} disabled={booking} className="lavender-gradient text-white">
              {booking ? "..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
