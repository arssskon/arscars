"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Card } from "@/components/ui/card";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { useSearchStore } from "@/lib/store";
import { MapPin } from "lucide-react";
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
  const { mapCenter, zoom, setZoom } = useSearchStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const placemarkRefs = useRef<any[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  // Initialize map
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || mapInstance.current) return;

    let destroyed = false;

    const tryInit = () => {
      if (destroyed) return;
      if (!window.ymaps) {
        setTimeout(tryInit, 100);
        return;
      }

      window.ymaps.ready(() => {
        if (destroyed || !mapRef.current) return;

        const map = new window.ymaps.Map(mapRef.current, {
          center: [mapCenter.lat, mapCenter.lon],
          zoom,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapInstance.current = map;

        // Geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mapInstance.current) return;
              const { latitude, longitude } = pos.coords;
              mapInstance.current.setCenter([latitude, longitude], 14);

              const userMark = new window.ymaps.Placemark(
                [latitude, longitude],
                { balloonContent: "Вы здесь" },
                {
                  preset: "islands#dotCircleIcon",
                  iconColor: "#7c3aed",
                }
              );
              mapInstance.current.geoObjects.add(userMark);
            },
            () => {/* geolocation denied — stay at default center */}
          );
        }

        setMapReady(true);
      });
    };

    tryInit();

    return () => {
      destroyed = true;
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
        placemarkRefs.current = [];
      }
    };
  }, [scriptLoaded]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.ymaps) return;

    placemarkRefs.current.forEach((p) => mapInstance.current.geoObjects.remove(p));
    placemarkRefs.current = [];

    vehicles.forEach((vehicle) => {
      if (!vehicle.lastState) return;

      const price = vehicle.baseTariff.pricePerMinCents / 100;
      const isSelected = selectedVehicle?.id === vehicle.id;

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
            `<div style="
              font-size:11px;font-weight:700;
              color:${isSelected ? "#fff" : "#111"};
              padding:2px 4px;
            ">${price.toFixed(0)}₽</div>`
          ),
        }
      );

      placemark.events.add("click", () => onVehicleSelect?.(vehicle));
      mapInstance.current.geoObjects.add(placemark);
      placemarkRefs.current.push(placemark);
    });
  }, [vehicles, selectedVehicle, mapReady]);

  // Pan to selected vehicle
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !selectedVehicle?.lastState) return;
    mapInstance.current.panTo(
      [selectedVehicle.lastState.lat, selectedVehicle.lastState.lon],
      { flying: true }
    );
  }, [selectedVehicle, mapReady]);

  return (
    <>
      {apiKey && (
        <Script
          src={`https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`}
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
          onError={() => console.error("Yandex Maps script failed to load")}
        />
      )}
      <div className={cn("relative w-full h-full min-h-[400px] rounded-xl overflow-hidden", className)}>
        <div ref={mapRef} className="absolute inset-0" />

        {!scriptLoaded && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Загрузка карты…</span>
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
