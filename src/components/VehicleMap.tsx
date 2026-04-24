"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
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
        const glassLayout = window.ymaps.templateLayoutFactory.createClass(
          `<div style="
            background:${isSelected ? "rgba(124,58,237,0.92)" : "rgba(255,255,255,0.88)"};
            backdrop-filter:blur(8px);
            -webkit-backdrop-filter:blur(8px);
            border:1.5px solid ${isSelected ? "rgba(181,126,220,0.6)" : "rgba(181,126,220,0.4)"};
            border-radius:999px;
            padding:4px 10px;
            font-weight:700;
            font-size:13px;
            color:${isSelected ? "#fff" : "#4C1D95"};
            box-shadow:0 4px 12px rgba(124,58,237,0.18);
            white-space:nowrap;
          ">${price.toFixed(0)} ₽/мин</div>`
        );

        const placemark = new window.ymaps.Placemark(
          [vehicle.lastState.lat, vehicle.lastState.lon],
          {
            balloonContentHeader: `${vehicle.brand} ${vehicle.model}`,
            balloonContentBody: `${price.toFixed(0)}₽/мин · ${vehicle.year}`,
            hintContent: `${vehicle.brand} ${vehicle.model} — ${price.toFixed(0)}₽/мин`,
          },
          {
            iconLayout: glassLayout,
            iconShape: { type: "Rectangle", coordinates: [[-50, -16], [50, 16]] },
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
          <div
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-full"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(181,126,220,0.35)",
              boxShadow: "0 4px 12px rgba(124,58,237,0.12)",
            }}
          >
            <MapPin className="h-4 w-4 text-lavender-600" />
            <span className="font-medium text-lavender-900">Челябинск · Екатеринбург</span>
            <span className="text-lavender-500">{vehicles.length} авто</span>
          </div>
        </div>
      </div>
    </>
  );
}
