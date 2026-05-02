"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { MapPin } from "lucide-react";

declare global {
  interface Window { ymaps: any; }
}

interface Props {
  lat: string;
  lon: string;
  onChange: (lat: string, lon: string) => void;
  onAddressChange?: (address: string) => void;
}

export function MapPicker({ lat, lon, onChange, onAddressChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onAddressRef = useRef(onAddressChange);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onAddressRef.current = onAddressChange; }, [onAddressChange]);

  const geocode = useCallback((gLat: number, gLon: number) => {
    if (!window.ymaps || !onAddressRef.current) return;
    window.ymaps
      .geocode([gLat, gLon], { results: 1 })
      .then((res: any) => {
        const obj = res.geoObjects.get(0);
        if (obj) onAddressRef.current!(obj.getAddressLine());
      })
      .catch(() => {});
  }, []);

  const placeMarker = useCallback(
    (map: any, pLat: number, pLon: number) => {
      if (markerRef.current) {
        try { map.geoObjects.remove(markerRef.current); } catch {}
      }
      const pm = new window.ymaps.Placemark(
        [pLat, pLon],
        { balloonContent: "Место выдачи" },
        { preset: "islands#violetDotCircleIcon", draggable: true }
      );
      pm.events.add("dragend", () => {
        const [dLat, dLon] = pm.geometry.getCoordinates() as [number, number];
        onChangeRef.current(dLat.toFixed(6), dLon.toFixed(6));
        geocode(dLat, dLon);
      });
      map.geoObjects.add(pm);
      markerRef.current = pm;
    },
    [geocode]
  );

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.ymaps || mapInstance.current) return;

    const centerLat = lat ? parseFloat(lat) : 55.1644;
    const centerLon = lon ? parseFloat(lon) : 61.4368;

    window.ymaps.ready(() => {
      if (!mapRef.current) return;
      const map = new window.ymaps.Map(mapRef.current, {
        center: [centerLat, centerLon],
        zoom: lat ? 14 : 11,
        controls: ["zoomControl"],
      });
      mapInstance.current = map;

      if (lat && lon) placeMarker(map, parseFloat(lat), parseFloat(lon));

      map.events.add("click", (e: any) => {
        const [cLat, cLon] = e.get("coords") as [number, number];
        placeMarker(map, cLat, cLon);
        onChangeRef.current(cLat.toFixed(6), cLon.toFixed(6));
        geocode(cLat, cLon);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeMarker, geocode]);

  // detect if ymaps already loaded (e.g. from search page)
  useEffect(() => {
    if (typeof window !== "undefined" && window.ymaps) setScriptReady(true);
  }, []);

  useEffect(() => {
    if (!scriptReady) return;
    initMap();
    return () => {
      if (mapInstance.current) {
        try { mapInstance.current.destroy(); } catch {}
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [scriptReady, initMap]);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  return (
    <div className="space-y-2">
      {apiKey && !scriptReady && (
        <Script
          src={`https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}

      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
        <MapPin className="h-3.5 w-3.5 text-lavender-400 flex-shrink-0" />
        Нажмите на карту чтобы отметить место выдачи. Маркер можно перетащить.
      </div>

      <div className="relative rounded-xl overflow-hidden border border-lavender-200" style={{ height: 280 }}>
        <div ref={mapRef} className="absolute inset-0" />
        {!scriptReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-lavender-50/80">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Загрузка карты…</span>
          </div>
        )}
      </div>

      {lat && lon ? (
        <p className="text-xs text-lavender-600 font-mono flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {parseFloat(lat).toFixed(5)}, {parseFloat(lon).toFixed(5)}
        </p>
      ) : (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Местоположение не выбрано (необязательно)
        </p>
      )}
    </div>
  );
}
