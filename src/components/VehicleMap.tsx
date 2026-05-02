"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { useSearchStore } from "@/lib/store";
import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window { ymaps: any; }
}

interface Props {
  vehicles: VehicleWithDetails[];
  onVehicleSelect?: (v: VehicleWithDetails) => void;
  selectedVehicle?: VehicleWithDetails | null;
  className?: string;
}

export function VehicleMap({ vehicles, onVehicleSelect, selectedVehicle, className }: Props) {
  const { mapCenter, zoom } = useSearchStore();
  const mapRef          = useRef<HTMLDivElement>(null);
  const mapInstance     = useRef<any>(null);
  const placemarkRefs   = useRef<any[]>([]);
  const vehiclesRef     = useRef(vehicles);
  const onSelectRef     = useRef(onVehicleSelect);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady]         = useState(false);
  const [mapError, setMapError]         = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  useEffect(() => { vehiclesRef.current = vehicles; }, [vehicles]);
  useEffect(() => { onSelectRef.current = onVehicleSelect; }, [onVehicleSelect]);

  const buildMap = useCallback((lat: number, lon: number, z: number) => {
    if (!mapRef.current || !window.ymaps) return;
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

      // Click handler: ymaps events-pane captures ALL clicks.
      // We hit-test in global-pixel space — no z-index tricks needed.
      map.events.add("click", (e: any) => {
        const clickCoords: [number, number] = e.get("coords");
        if (!clickCoords) return;
        try {
          const zoom = map.getZoom();
          const proj = map.options.get("projection");
          const clickGP = proj.toGlobalPixels(clickCoords, zoom);

          for (const v of vehiclesRef.current) {
            if (!v.lastState) continue;
            const vGP = proj.toGlobalPixels([v.lastState.lat, v.lastState.lon], zoom);
            const dx = clickGP[0] - vGP[0]; // horizontal offset
            const dy = clickGP[1] - vGP[1]; // vertical offset (positive = click below anchor)
            // Pill is above anchor: dy ∈ [-36, -4], dx ∈ [-55, 55]
            if (Math.abs(dx) <= 55 && dy >= -36 && dy <= -4) {
              onSelectRef.current?.(v);
              return;
            }
          }
        } catch {}
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (!mapInstance.current) return;
          const { latitude, longitude } = pos.coords;
          mapInstance.current.setCenter([latitude, longitude], 14);
          mapInstance.current.geoObjects.add(new window.ymaps.Placemark(
            [latitude, longitude],
            { balloonContent: "Вы здесь" },
            { preset: "islands#dotCircleIcon", iconColor: "#7c3aed" }
          ));
        }, () => {});
      }
    } catch (err) {
      console.error("Map init error:", err);
      setMapError(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ymaps) setScriptLoaded(true);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;
    let destroyed = false;
    const tryInit = () => {
      if (destroyed) return;
      if (!window.ymaps) { setTimeout(tryInit, 100); return; }
      window.ymaps.ready(() => { if (!destroyed) buildMap(mapCenter.lat, mapCenter.lon, zoom); });
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

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && mapInstance.current) {
          requestAnimationFrame(() => {
            try { mapInstance.current?.container.fitToViewport(); } catch {}
          });
        } else if (width > 0 && height > 0 && window.ymaps && scriptLoaded) {
          window.ymaps.ready(() => buildMap(mapCenter.lat, mapCenter.lon, zoom));
        }
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, buildMap]);

  // Rebuild glass-pill placemarks whenever vehicles or selection changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.ymaps) return;

    placemarkRefs.current.forEach((p) => {
      try { mapInstance.current.geoObjects.remove(p); } catch {}
    });
    placemarkRefs.current = [];

    vehicles.forEach((vehicle) => {
      if (!vehicle.lastState) return;
      const price      = vehicle.baseTariff.pricePerMinCents / 100;
      const isSelected = selectedVehicle?.id === vehicle.id;

      const bg  = isSelected ? "rgba(109,40,217,0.93)"     : "rgba(255,255,255,0.92)";
      const bdr = isSelected ? "rgba(167,139,250,0.80)"    : "rgba(181,126,220,0.50)";
      const clr = isSelected ? "#ffffff"                   : "#4C1D95";
      const shd = isSelected
        ? "0 4px 16px rgba(109,40,217,0.40)"
        : "0 4px 14px rgba(124,58,237,0.18)";

      const layout = window.ymaps.templateLayoutFactory.createClass(
        `<div style="
          display:inline-flex;align-items:center;
          background:${bg};
          backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          border:1.5px solid ${bdr};
          border-radius:999px;padding:5px 13px;
          font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
          font-weight:700;font-size:13px;line-height:1;
          color:${clr};box-shadow:${shd};
          white-space:nowrap;cursor:pointer;position:relative;">
          ${price.toFixed(0)}&nbsp;₽/мин
          <span style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:6px solid ${bg};"></span>
        </div>`
      );

      try {
        const pm = new window.ymaps.Placemark(
          [vehicle.lastState.lat, vehicle.lastState.lon],
          {},
          {
            iconLayout: layout,
            iconOffset: [-52, -36],
            iconShape: { type: "Rectangle", coordinates: [[-55, -36], [55, -4]] },
          }
        );
        mapInstance.current.geoObjects.add(pm);
        placemarkRefs.current.push(pm);
      } catch {}
    });
  }, [vehicles, selectedVehicle, mapReady]);

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
    if (window.ymaps) window.ymaps.ready(() => buildMap(mapCenter.lat, mapCenter.lon, zoom));
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
            <button onClick={handleReload} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <RefreshCw className="h-4 w-4" /> Повторить
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
