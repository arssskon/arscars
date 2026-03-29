"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { Card } from "@/components/ui/card";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { useSearchStore } from "@/lib/store";
import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    ymaps: any;
  }
}

interface Props {
  vehicles: VehicleWithDetails[];
  onVehicleSelect?: (v: VehicleWithDetails) => void;
  selectedVehicle?: VehicleWithDetails | null;
  className?: string;
}

export function VehicleMap({ vehicles, onVehicleSelect, selectedVehicle, className }: Props) {
  const { mapCenter, zoom } = useSearchStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const placemarkRefs = useRef<any[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  // Если скрипт уже был загружен при предыдущем монтировании — сразу ставим флаг
  useEffect(() => {
    if (typeof window !== "undefined" && window.ymaps) {
      setScriptLoaded(true);
    }
  }, []);

  const buildMap = useCallback((lat: number, lon: number, z: number) => {
    if (!mapRef.current || !window.ymaps) return;

    // Destroy stale instance if any
    if (mapInstance.current) {
      try { mapInstance.current.destroy(); } catch {}
      mapInstance.current = null;
      placemarkRefs.current = [];
      setMapReady(false);
    }

    try {
      const map = new window.ymaps.Map(mapRef.current, {
        center: [lat, lon],
        zoom: z,
        controls: ["zoomControl", "fullscreenControl"],
      });
      mapInstance.current = map;
      setMapError(false);
      setMapReady(true);

      // Show user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mapInstance.current) return;
            const { latitude, longitude } = pos.coords;
            mapInstance.current.setCenter([latitude, longitude], 14);
            const userMark = new window.ymaps.Placemark(
              [latitude, longitude],
              { balloonContent: "Вы здесь" },
              { preset: "islands#dotCircleIcon", iconColor: "#7c3aed" }
            );
            mapInstance.current.geoObjects.add(userMark);
          },
          () => {}
        );
      }
    } catch (e) {
      console.error("Map init error:", e);
      setMapError(true);
    }
  }, []);

  // Initialize map when script loads
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;
    let destroyed = false;

    const tryInit = () => {
      if (destroyed) return;
      if (!window.ymaps) { setTimeout(tryInit, 100); return; }
      window.ymaps.ready(() => {
        if (destroyed) return;
        buildMap(mapCenter.lat, mapCenter.lon, zoom);
      });
    };

    tryInit();

    return () => {
      destroyed = true;
      if (mapInstance.current) {
        try { mapInstance.current.destroy(); } catch {}
        mapInstance.current = null;
        placemarkRefs.current = [];
      }
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  // ResizeObserver: когда контейнер появляется/меняет размер — восстанавливаем карту
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (mapInstance.current) {
            // Карта существует — ждём следующего кадра и обновляем viewport
            requestAnimationFrame(() => {
              try { mapInstance.current?.container.fitToViewport(); } catch {}
            });
          } else if (window.ymaps && scriptLoaded) {
            // Карта не создана — инициализируем
            window.ymaps.ready(() => buildMap(mapCenter.lat, mapCenter.lon, zoom));
          }
        }
      }
    });

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, buildMap]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.ymaps) return;

    placemarkRefs.current.forEach((p) => {
      try { mapInstance.current.geoObjects.remove(p); } catch {}
    });
    placemarkRefs.current = [];

    vehicles.forEach((vehicle) => {
      if (!vehicle.lastState) return;

      const price = vehicle.baseTariff.pricePerMinCents / 100;
      const isSelected = selectedVehicle?.id === vehicle.id;

      try {
        const placemark = new window.ymaps.Placemark(
          [vehicle.lastState.lat, vehicle.lastState.lon],
          {
            balloonContentHeader: `${vehicle.brand} ${vehicle.model}`,
            balloonContentBody: `${price.toFixed(0)}₽/мин · ${vehicle.year}`,
            hintContent: `${vehicle.brand} ${vehicle.model} — ${price.toFixed(0)}₽/мин`,
          },
          {
            preset: isSelected ? "islands#violetStretchyIcon" : "islands#blueStretchyIcon",
            iconContentLayout: window.ymaps.templateLayoutFactory.createClass(
              `<div style="font-size:11px;font-weight:700;color:${isSelected ? "#fff" : "#111"};padding:2px 4px;">${price.toFixed(0)}₽</div>`
            ),
          }
        );

        placemark.events.add("click", () => onVehicleSelect?.(vehicle));
        mapInstance.current.geoObjects.add(placemark);
        placemarkRefs.current.push(placemark);
      } catch {}
    });
  }, [vehicles, selectedVehicle, mapReady]);

  // Pan to selected vehicle
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !selectedVehicle?.lastState) return;
    try {
      mapInstance.current.panTo(
        [selectedVehicle.lastState.lat, selectedVehicle.lastState.lon],
        { flying: true }
      );
    } catch {}
  }, [selectedVehicle, mapReady]);

  const handleReload = () => {
    if (!window.ymaps) return;
    window.ymaps.ready(() => buildMap(mapCenter.lat, mapCenter.lon, zoom));
  };

  return (
    <>
      {apiKey && (
        <Script
          src={`https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`}
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
          onError={() => { console.error("Yandex Maps script failed"); setMapError(true); }}
        />
      )}
      <div className={cn("relative w-full h-full min-h-[400px] rounded-xl overflow-hidden", className)}>
        <div ref={mapRef} className="absolute inset-0" />

        {!scriptLoaded && !mapError && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Загрузка карты…</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
            <span className="text-muted-foreground text-sm">Не удалось загрузить карту</span>
            <button
              onClick={handleReload}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="px-3 py-2 shadow-lg bg-white/95">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Челябинск · Екатеринбург</span>
              <span className="text-muted-foreground">{vehicles.length} авто</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
