"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleMap } from "@/components/VehicleMap";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { filterVehicles, calculateDistance, vehicleClasses, transmissions, fuelTypes } from "@/lib/mock-data";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { useSearchStore } from "@/lib/store";
import { List, Map, SlidersHorizontal, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const classLabels: Record<string, string> = { sport: "Спорт", luxury: "Люкс", suv: "Внедорожник", coupe: "Купе", sedan: "Седан" };
const fuelLabels: Record<string, string>  = { petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид" };
const transLabels: Record<string, string> = { AT: "Автомат", MT: "Механика", PDK: "PDK" };

type View = "split" | "list" | "map";

export default function SearchPage() {
  const [view, setView] = useState<View>("split");
  const { filters, setFilters, selectedVehicle, setSelectedVehicle, resetFilters } = useSearchStore();
  const [address, setAddress] = useState(filters.location?.address || "Челябинск");
  const [selClass, setSelClass] = useState<number[]>(filters.vehicleClassIds || []);
  const [selTrans, setSelTrans] = useState<number[]>(filters.transmissionIds || []);
  const [selFuel, setSelFuel] = useState<number[]>(filters.fuelTypeIds || []);
  const [showFilters, setShowFilters] = useState(false);
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllVehicles(data); })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, []);

  const activeCount = selClass.length + selTrans.length + selFuel.length;

  const filtered = useMemo(() => {
    let v = filterVehicles(allVehicles, {
      classIds: selClass,
      transmissionIds: selTrans,
      fuelTypeIds: selFuel,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
    });
    if (filters.location) {
      v = v.map((x) => ({
        ...x,
        distance: x.lastState
          ? calculateDistance(filters.location!.lat, filters.location!.lon, x.lastState.lat, x.lastState.lon)
          : undefined,
      }));
      v.sort(
        (a, b) =>
          ((a as VehicleWithDetails & { distance?: number }).distance ?? 999) -
          ((b as VehicleWithDetails & { distance?: number }).distance ?? 999)
      );
    }
    return v as (VehicleWithDetails & { distance?: number })[];
  }, [allVehicles, selClass, selTrans, selFuel, filters]);

  const toggle = (id: number, arr: number[], set: (a: number[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const handleSearch = () => {
    setFilters({
      location: { ...filters.location!, address },
      vehicleClassIds: selClass.length ? selClass : undefined,
      transmissionIds: selTrans.length ? selTrans : undefined,
      fuelTypeIds: selFuel.length ? selFuel : undefined,
    });
  };
  const handleReset = () => {
    setSelClass([]); setSelTrans([]); setSelFuel([]);
    setAddress("Челябинск");
    resetFilters();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Search bar */}
      <div
        className="border-b p-4"
        style={{
          background: "rgba(240, 236, 248, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "rgba(181, 126, 220, 0.15)",
        }}
      >
        <div className="container mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-lavender-400" />
            <Input
              placeholder="Введите адрес"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 pl-10 bg-white/50 backdrop-blur border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400"
            />
          </div>

          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <div>
                <GlassButton variant="outline" className="h-12 rounded-xl">
                  <SlidersHorizontal className="h-4 w-4" />
                  Фильтры
                  {activeCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-lavender-400 text-white text-xs font-semibold leading-none">
                      {activeCount}
                    </span>
                  )}
                </GlassButton>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 glass border-0 rounded-2xl" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-[var(--text-primary)]">Фильтры</h4>
                  <GlassButton variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 px-3">
                    Сбросить
                  </GlassButton>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-lavender-800 uppercase tracking-wide">Класс</p>
                  <div className="flex flex-wrap gap-2">
                    {vehicleClasses.map((c) => (
                      <Badge
                        key={c.id}
                        variant={selClass.includes(c.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={selClass.includes(c.id) ? { background: "#B57EDC" } : {}}
                        onClick={() => toggle(c.id, selClass, setSelClass)}
                      >
                        {classLabels[c.name]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-lavender-800 uppercase tracking-wide">Коробка</p>
                  <div className="flex flex-wrap gap-2">
                    {transmissions.map((t) => (
                      <Badge
                        key={t.id}
                        variant={selTrans.includes(t.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={selTrans.includes(t.id) ? { background: "#B57EDC" } : {}}
                        onClick={() => toggle(t.id, selTrans, setSelTrans)}
                      >
                        {transLabels[t.name]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-lavender-800 uppercase tracking-wide">Топливо</p>
                  <div className="flex flex-wrap gap-2">
                    {fuelTypes.map((f) => (
                      <Badge
                        key={f.id}
                        variant={selFuel.includes(f.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={selFuel.includes(f.id) ? { background: "#B57EDC" } : {}}
                        onClick={() => toggle(f.id, selFuel, setSelFuel)}
                      >
                        {fuelLabels[f.name]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full rounded-xl"
                  onClick={() => { handleSearch(); setShowFilters(false); }}
                >
                  Применить
                </GlassButton>
              </div>
            </PopoverContent>
          </Popover>

          <GlassButton variant="primary" className="h-12 rounded-xl" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Найти
          </GlassButton>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div
        className="flex items-center justify-between border-b px-4 py-2 md:hidden"
        style={{ background: "rgba(240, 236, 248, 0.6)", borderColor: "rgba(181, 126, 220, 0.15)" }}
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {loadingVehicles ? "Загрузка..." : `${filtered.length} авто`}
        </span>
        <div className="flex gap-1">
          <GlassButton
            variant={view === "list" ? "primary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </GlassButton>
          <GlassButton
            variant={view === "map" ? "primary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => setView("map")}
          >
            <Map className="h-4 w-4" />
          </GlassButton>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Vehicle list panel */}
        <div
          className={cn(
            "w-full md:w-[450px] flex-shrink-0 flex-col",
            view === "map" ? "hidden md:flex" : "flex"
          )}
          style={{ background: "rgba(240, 236, 248, 0.5)", borderRight: "1px solid rgba(181, 126, 220, 0.15)" }}
        >
          <div
            className="hidden md:flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(181, 126, 220, 0.15)" }}
          >
            <span className="font-medium text-[var(--text-primary)]">
              {loadingVehicles ? "Загрузка..." : `${filtered.length} автомобилей`}
            </span>
            <div className="flex gap-1">
              <GlassButton
                variant={view === "split" ? "primary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setView("split")}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </GlassButton>
              <GlassButton
                variant={view === "list" ? "primary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </GlassButton>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div
              className={cn(
                "p-4 space-y-4",
                view === "list" && "md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
              )}
            >
              {loadingVehicles ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 glass rounded-xl animate-pulse" />
                ))
              ) : (
                <>
                  {filtered.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      distance={v.distance}
                      onSelect={setSelectedVehicle}
                      selected={selectedVehicle?.id === v.id}
                      compact={view === "split"}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full glass flex items-center justify-center mb-4">
                        <SlidersHorizontal className="h-8 w-8 text-lavender-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-[var(--text-primary)]">Не найдено</h3>
                      <p style={{ color: "var(--text-secondary)" }}>Измените фильтры</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Map panel */}
        <div className={cn("flex-1 relative", view === "list" ? "hidden md:block" : "block")}>
          <VehicleMap
            vehicles={filtered}
            onVehicleSelect={setSelectedVehicle}
            selectedVehicle={selectedVehicle}
            className="h-full"
          />
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20">
              <VehicleCard vehicle={selectedVehicle} compact />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
