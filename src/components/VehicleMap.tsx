"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstance   = useRef<any>(null);
  const vehiclesRef   = useRef(vehicles);
  const onSelectRef   = useRef(onVehicleSelect);
  const markerDivRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady]         = useState(false);
  const [mapError, setMapError]         = useState(false);
  const [vehicleList, setVehicleList]   = useState<VehicleWithDetails[]>([]);
  // Custom pane div injected inside ymaps' inner-panes —
  // participates in the same CSS transform ymaps uses for smooth pan/zoom
  const [customPane, setCustomPane]     = useState<HTMLElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  useEffect(() => { vehiclesRef.current = vehicles; }, [vehicles]);
  useEffect(() => { onSelectRef.current = onVehicleSelect; }, [onVehicleSelect]);

  const toPixel = (lat: number, lon: number) => {
    const map = mapInstance.current;
    if (!map) return { x: -9999, y: -9999 };
    try {
      const z    = map.getZoom();
      const proj = map.options.get("projection");
      const gc   = map.getGlobalPixelCenter();
      const sz   = map.container.getSize();
      const gp   = proj.toGlobalPixels([lat, lon], z);
      return { x: gp[0] - gc[0] + sz[0] / 2, y: gp[1] - gc[1] + sz[1] / 2 };
    } catch { return { x: -9999, y: -9999 }; }
  };

  // Write positions directly to DOM — no React state, no re-render
  const updatePositions = useCallback(() => {
    if (!mapInstance.current) return;
    for (const v of vehiclesRef.current) {
      if (!v.lastState) continue;
      const el = markerDivRefs.current.get(v.id);
      if (!el) continue;
      const { x, y } = toPixel(v.lastState.lat, v.lastState.lon);
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
    }
  }, []);

  const buildMap = useCallback((lat: number, lon: number, z: number) => {
    if (!mapRef.current || !window.ymaps) return;
    if (mapInstance.current) {
      try { mapInstance.current.destroy(); } catch {}
      mapInstance.current = null;
      setMapReady(false);
      setCustomPane(null);
      markerDivRefs.current.clear();
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

      // Inject our pane inside ymaps' inner-panes.
      // ymaps applies CSS transform to inner-panes during pan/zoom —
      // our markers inside it move with tiles automatically (zero lag).
      requestAnimationFrame(() => {
        if (!mapRef.current) return;
        const innerPanes = mapRef.current.querySelector<HTMLElement>('[class*="inner-panes"]');
        if (!innerPanes) return;
        const pane = document.createElement("div");
        pane.style.cssText = "position:absolute;top:0;left:0;z-index:2600;pointer-events:none;";
        innerPanes.appendChild(pane);
        setCustomPane(pane);
      });

      // Reposition markers after pan/zoom settles (CSS transform is removed by ymaps)
      map.events.add("boundschange", () => requestAnimationFrame(updatePositions));
      map.events.add("sizechange", updatePositions);

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
  }, [updatePositions]);

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
      }
      setMapReady(false);
      setCustomPane(null);
      markerDivRefs.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (mapInstance.current) {
            requestAnimationFrame(() => {
              try { mapInstance.current?.container.fitToViewport(); } catch {}
              updatePositions();
            });
          } else if (window.ymaps && scriptLoaded) {
            window.ymaps.ready(() => buildMap(mapCenter.lat, mapCenter.lon, zoom));
          }
        }
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, buildMap, updatePositions]);

  useEffect(() => {
    setVehicleList(vehicles.filter(v => !!v.lastState));
  }, [vehicles]);

  // Position markers before first paint after pane/list is ready
  useLayoutEffect(() => {
    if (mapReady && customPane) updatePositions();
  }, [vehicleList, mapReady, customPane, updatePositions]);

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

  const markerJSX = vehicleList.map((vehicle) => {
    const price      = vehicle.baseTariff.pricePerMinCents / 100;
    const isSelected = selectedVehicle?.id === vehicle.id;
    return (
      <div
        key={vehicle.id}
        ref={(el) => {
          if (el) markerDivRefs.current.set(vehicle.id, el);
          else    markerDivRefs.current.delete(vehicle.id);
        }}
        onClick={() => onSelectRef.current?.(vehicle)}
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          transform: "translate(-50%, calc(-100% - 6px))",
          cursor: "pointer",
          pointerEvents: "auto", // override parent pane's pointer-events:none
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: isSelected ? "rgba(109,40,217,0.93)" : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1.5px solid ${isSelected ? "rgba(167,139,250,0.80)" : "rgba(181,126,220,0.50)"}`,
            borderRadius: "999px",
            padding: "5px 13px",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif",
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1,
            color: isSelected ? "#ffffff" : "#4C1D95",
            boxShadow: isSelected
              ? "0 4px 16px rgba(109,40,217,0.40)"
              : "0 4px 14px rgba(124,58,237,0.18)",
            whiteSpace: "nowrap",
            position: "relative",
            userSelect: "none",
          }}
        >
          {price.toFixed(0)}&nbsp;₽/мин
          <span
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${isSelected ? "rgba(109,40,217,0.93)" : "rgba(255,255,255,0.92)"}`,
            }}
          />
        </div>
      </div>
    );
  });

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

        {/* Markers live inside ymaps' inner-panes via portal — move with map tiles */}
        {customPane && createPortal(markerJSX, customPane)}

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
