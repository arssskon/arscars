"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleMap } from "@/components/VehicleMap";
import { filterVehicles, calculateDistance, vehicleClasses, transmissions, fuelTypes } from "@/lib/mock-data";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { useSearchStore } from "@/lib/store";
import { List, Map, SlidersHorizontal, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const classLabels: Record<string, string> = { sport: "Спорт", luxury: "Люкс", suv: "Внедорожник", coupe: "Купе", sedan: "Седан" };
const fuelLabels: Record<string, string> = { petrol: "Бензин", diesel: "Дизель", electric: "Электро", hybrid: "Гибрид" };
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
      .then((data) => {
        if (Array.isArray(data)) setAllVehicles(data);
      })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, []);

  const activeCount = selClass.length + selTrans.length + selFuel.length;

  const filtered = useMemo(() => {
    let v = filterVehicles(allVehicles, { classIds: selClass, transmissionIds: selTrans, fuelTypeIds: selFuel, minPrice: filters.minPrice, maxPrice: filters.maxPrice });
    if (filters.location) {
      v = v.map((x) => ({ ...x, distance: x.lastState ? calculateDistance(filters.location!.lat, filters.location!.lon, x.lastState.lat, x.lastState.lon) : undefined }));
      v.sort((a, b) => ((a as VehicleWithDetails & { distance?: number }).distance ?? 999) - ((b as VehicleWithDetails & { distance?: number }).distance ?? 999));
    }
    return v as (VehicleWithDetails & { distance?: number })[];
  }, [allVehicles, selClass, selTrans, selFuel, filters]);

  const toggle = (id: number, arr: number[], set: (a: number[]) => void) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const handleSearch = () => { setFilters({ location: { ...filters.location!, address }, vehicleClassIds: selClass.length ? selClass : undefined, transmissionIds: selTrans.length ? selTrans : undefined, fuelTypeIds: selFuel.length ? selFuel : undefined }); };
  const handleReset = () => { setSelClass([]); setSelTrans([]); setSelFuel([]); setAddress("Челябинск"); resetFilters(); };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background p-4">
        <div className="container mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Введите адрес" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 pl-10" />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 gap-2">
                <SlidersHorizontal className="h-4 w-4" />Фильтры{activeCount > 0 && <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">{activeCount}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex justify-between"><h4 className="font-semibold">Фильтры</h4><Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">Сбросить</Button></div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Класс</p>
                  <div className="flex flex-wrap gap-2">{vehicleClasses.map((c) => <Badge key={c.id} variant={selClass.includes(c.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(c.id, selClass, setSelClass)}>{classLabels[c.name]}</Badge>)}</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Коробка</p>
                  <div className="flex flex-wrap gap-2">{transmissions.map((t) => <Badge key={t.id} variant={selTrans.includes(t.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(t.id, selTrans, setSelTrans)}>{transLabels[t.name]}</Badge>)}</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Топливо</p>
                  <div className="flex flex-wrap gap-2">{fuelTypes.map((f) => <Badge key={f.id} variant={selFuel.includes(f.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggle(f.id, selFuel, setSelFuel)}>{fuelLabels[f.name]}</Badge>)}</div>
                </div>
                <Button onClick={() => { handleSearch(); setShowFilters(false); }} className="w-full lavender-gradient text-white">Применить</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSearch} className="h-12 gap-2 lavender-gradient text-white"><Search className="h-4 w-4" />Найти</Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b bg-background px-4 py-2 md:hidden">
        <span className="text-sm font-medium">{loadingVehicles ? "Загрузка..." : `${filtered.length} авто`}</span>
        <div className="flex gap-1">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
          <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" onClick={() => setView("map")}><Map className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("w-full md:w-[450px] flex-shrink-0 border-r bg-background flex-col", view === "map" ? "hidden md:flex" : "flex")}>
          <div className="hidden md:flex items-center justify-between border-b px-4 py-3">
            <span className="font-medium">{loadingVehicles ? "Загрузка..." : `${filtered.length} автомобилей`}</span>
            <div className="flex gap-1">
              <Button variant={view === "split" ? "secondary" : "ghost"} size="sm" onClick={() => setView("split")}><SlidersHorizontal className="h-4 w-4" /></Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className={cn("p-4 space-y-4", view === "list" && "md:grid md:grid-cols-2 md:gap-4 md:space-y-0")}>
              {loadingVehicles ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
                ))
              ) : (
                <>
                  {filtered.map((v) => <VehicleCard key={v.id} vehicle={v} distance={v.distance} onSelect={setSelectedVehicle} selected={selectedVehicle?.id === v.id} compact={view === "split"} />)}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"><SlidersHorizontal className="h-8 w-8 text-muted-foreground" /></div>
                      <h3 className="font-semibold text-lg mb-2">Не найдено</h3>
                      <p className="text-muted-foreground">Измените фильтры</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className={cn("flex-1 relative", view === "list" ? "hidden md:block" : "block")}>
          <VehicleMap vehicles={filtered} onVehicleSelect={setSelectedVehicle} selectedVehicle={selectedVehicle} className="h-full" />
          {selectedVehicle && <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 shadow-xl z-20"><VehicleCard vehicle={selectedVehicle} compact /></Card>}
        </div>
      </div>
    </div>
  );
}
