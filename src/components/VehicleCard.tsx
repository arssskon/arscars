"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Star, Fuel, Zap, MapPin, Settings2, Gauge, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassBadge, deriveClass } from "@/components/ui/ClassBadge";

const fuelLabels: Record<string, string> = { petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид" };
const transLabels: Record<string, string> = { AT: "Автомат", MT: "Механика", PDK: "PDK" };
const classLabels: Record<string, string> = { sport: "Спорт", luxury: "Люкс", suv: "Внедорожник", coupe: "Купе", sedan: "Седан" };

interface Props {
  vehicle: VehicleWithDetails;
  distance?: number;
  onSelect?: (v: VehicleWithDetails) => void;
  selected?: boolean;
  compact?: boolean;
}

export function VehicleCard({ vehicle, distance, onSelect, selected, compact }: Props) {
  const router = useRouter();
  const price = vehicle.baseTariff.pricePerMinCents / 100;
  const isElectric = vehicle.fuelType.name === "electric" || vehicle.fuelType.name === "hybrid";

  if (compact) {
    return (
      <Card
        className={cn(
          "vehicle-card cursor-pointer overflow-hidden border-2 transition-all",
          selected ? "border-primary shadow-lg" : "border-transparent hover:border-primary/30"
        )}
        onClick={() => onSelect?.(vehicle)}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {vehicle.photoUrl ? (
                <Image src={vehicle.photoUrl} alt={vehicle.model} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Settings2 className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{vehicle.brand} {vehicle.model}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {vehicle.rating && (
                    <div className="flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{vehicle.rating}</span>
                    </div>
                  )}
                  {distance !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {distance < 1 ? `${(distance * 1000).toFixed(0)} м` : `${distance.toFixed(1)} км`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-primary font-bold text-sm">{price.toFixed(0)} ₽/мин</div>
                <Link href={`/vehicles/${vehicle.id}`} onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" className="lavender-gradient text-white hover:opacity-90 text-xs h-7 px-2 shrink-0">
                    Подробнее
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "vehicle-card overflow-hidden border-2 transition-all group cursor-pointer",
        selected ? "border-primary shadow-lg" : "border-transparent hover:border-primary/30 hover:shadow-md",
      )}
      onClick={() => { onSelect?.(vehicle); router.push(`/vehicles/${vehicle.id}`); }}
    >
      {/* Photo */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {vehicle.photoUrl ? (
          <Image
            src={vehicle.photoUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Settings2 className="h-12 w-12" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <Badge className={cn(
            "text-xs font-semibold shadow",
            vehicle.status === "available" ? "bg-green-500 hover:bg-green-600" : "bg-slate-600 text-white"
          )}>
            {vehicle.status === "available" ? "Доступен" : "Занят"}
          </Badge>
          <ClassBadge className={deriveClass(price)} />
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs font-medium border-white/50">
            {classLabels[vehicle.vehicleClass.name]}
          </Badge>
        </div>

        {/* Rating bottom-left */}
        {vehicle.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-xs font-semibold">{vehicle.rating}</span>
          </div>
        )}

        {/* Distance bottom-right */}
        {distance !== undefined && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1">
            <MapPin className="h-3 w-3 text-white" />
            <span className="text-white text-xs">
              {distance < 1 ? `${(distance * 1000).toFixed(0)} м` : `${distance.toFixed(1)} км`}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{vehicle.brand}</p>
            <h3 className="font-bold text-xl leading-tight">{vehicle.model}</h3>
            {vehicle.year && <p className="text-xs text-muted-foreground mt-0.5">{vehicle.year} год</p>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary leading-none">{price.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">₽/мин</div>
          </div>
        </div>

        {/* Description */}
        {vehicle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {vehicle.description}
          </p>
        )}

        {/* Specs row */}
        {(vehicle.horsePower || vehicle.acceleration || vehicle.topSpeed) && (
          <div className="flex gap-3 mb-3 py-2 border-y">
            {vehicle.horsePower && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Gauge className="h-3.5 w-3.5 text-primary/70" />
                <span className="font-semibold">{vehicle.horsePower}</span>
                <span className="text-muted-foreground">л.с.</span>
              </div>
            )}
            {vehicle.acceleration && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Timer className="h-3.5 w-3.5 text-primary/70" />
                <span className="font-semibold">{vehicle.acceleration}с</span>
                <span className="text-muted-foreground">0–100</span>
              </div>
            )}
            {vehicle.topSpeed && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span className="font-semibold">{vehicle.topSpeed}</span>
                <span className="text-muted-foreground">км/ч</span>
              </div>
            )}
          </div>
        )}

        {/* Tags + button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-xs">
              {isElectric ? <Zap className="h-3 w-3" /> : <Fuel className="h-3 w-3" />}
              {fuelLabels[vehicle.fuelType.name]}
            </Badge>
            <Badge variant="secondary" className="text-xs">{transLabels[vehicle.transmission.name]}</Badge>
          </div>
          <Link href={`/vehicles/${vehicle.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="lavender-gradient text-white hover:opacity-90 shrink-0">
              Подробнее
            </Button>
          </Link>
        </div>

        {/* Min charge note */}
        <p className="text-xs text-muted-foreground mt-2">
          Минимальная сумма: {(vehicle.baseTariff.minChargeCents / 100).toFixed(0)} ₽
        </p>
      </CardContent>
    </Card>
  );
}
