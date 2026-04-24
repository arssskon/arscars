"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass/GlassCard";
import { GlassBadge } from "@/components/ui/glass/GlassBadge";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Star, Fuel, Zap, MapPin, Settings2, Gauge, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClassBadge, deriveClass } from "@/components/ui/ClassBadge";

const fuelLabels: Record<string, string> = {
  petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид",
};
const transLabels: Record<string, string> = { AT: "Автомат", MT: "Механика", PDK: "PDK" };

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
      <div
        className={cn(
          "glass rounded-2xl p-3 cursor-pointer transition-all duration-200",
          selected
            ? "border-2 border-lavender-400 shadow-lg shadow-lavender-400/20"
            : "hover:border-lavender-300/60"
        )}
        onClick={() => onSelect?.(vehicle)}
      >
        <div className="flex gap-3">
          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-lavender-50">
            {vehicle.photoUrl ? (
              <Image src={vehicle.photoUrl} alt={vehicle.model} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-lavender-300">
                <Settings2 className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <h3 className="font-semibold text-sm line-clamp-1" style={{ color: "var(--text-primary)" }}>
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {vehicle.rating && (
                  <div className="flex items-center gap-0.5 text-xs">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{vehicle.rating}</span>
                  </div>
                )}
                {distance !== undefined && (
                  <span className="text-xs text-gray-500">
                    {distance < 1
                      ? `${(distance * 1000).toFixed(0)} м`
                      : `${distance.toFixed(1)} км`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lavender-600 font-bold text-sm">{price.toFixed(0)} ₽/мин</div>
              <Link href={`/vehicles/${vehicle.id}`} onClick={(e) => e.stopPropagation()}>
                <GlassButton size="sm" variant="primary" className="text-xs h-7 px-2">
                  Подробнее
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GlassCard
      hover
      className="p-0 overflow-hidden cursor-pointer"
      onClick={() => { onSelect?.(vehicle); router.push(`/vehicles/${vehicle.id}`); }}
    >
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-lavender-50">
        {vehicle.photoUrl ? (
          <Image
            src={vehicle.photoUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lavender-300">
            <Settings2 className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <ClassBadge className={deriveClass(price)} />
        </div>
        <div className="absolute top-3 right-3">
          <GlassBadge variant="lavender">{price.toFixed(0)} ₽/мин</GlassBadge>
        </div>

        {vehicle.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-xs font-semibold">{vehicle.rating}</span>
          </div>
        )}
        {distance !== undefined && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1">
            <MapPin className="h-3 w-3 text-white" />
            <span className="text-white text-xs">
              {distance < 1
                ? `${(distance * 1000).toFixed(0)} м`
                : `${distance.toFixed(1)} км`}
            </span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-4">
        <div className="mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{vehicle.brand}</p>
          <h3 className="font-bold text-xl leading-tight" style={{ color: "var(--text-primary)" }}>
            {vehicle.model}
          </h3>
          {vehicle.year && <p className="text-xs text-gray-500 mt-0.5">{vehicle.year} год</p>}
        </div>

        {vehicle.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {vehicle.description}
          </p>
        )}

        {(vehicle.horsePower || vehicle.acceleration || vehicle.topSpeed) && (
          <div className="flex gap-3 mb-3 py-2 border-y border-lavender-100/60">
            {vehicle.horsePower && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Gauge className="h-3.5 w-3.5 text-lavender-400" />
                <span className="font-semibold">{vehicle.horsePower}</span>
                <span className="text-gray-400">л.с.</span>
              </div>
            )}
            {vehicle.acceleration && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Timer className="h-3.5 w-3.5 text-lavender-400" />
                <span className="font-semibold">{vehicle.acceleration}с</span>
                <span className="text-gray-400">0–100</span>
              </div>
            )}
            {vehicle.topSpeed && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span className="font-semibold">{vehicle.topSpeed}</span>
                <span className="text-gray-400">км/ч</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <GlassBadge variant="neutral">
              {isElectric ? <Zap className="h-3 w-3" /> : <Fuel className="h-3 w-3" />}
              {fuelLabels[vehicle.fuelType.name]}
            </GlassBadge>
            <GlassBadge variant="neutral">{transLabels[vehicle.transmission.name]}</GlassBadge>
          </div>
          <Link href={`/vehicles/${vehicle.id}`} onClick={(e) => e.stopPropagation()}>
            <GlassButton size="sm" variant="primary">Подробнее</GlassButton>
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Минимальная сумма: {(vehicle.baseTariff.minChargeCents / 100).toFixed(0)} ₽
        </p>
      </div>
    </GlassCard>
  );
}
