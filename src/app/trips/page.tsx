"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import { Car, Clock, Calendar, CreditCard, CheckCircle, Play, ChevronRight, MapPin, Flag, Camera, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PhotoUploadZone, type TripPhoto } from "@/components/trip/PhotoUploadZone";
import { StartPhotoUpload } from "@/components/trip/StartPhotoUpload";
import { AnimatePresence, motion } from "framer-motion";

interface Reservation {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null; baseTariff: { pricePerMinCents: number } };
}

interface Trip {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMinutes: number | null;
  amountCents: number | null;
  vehicle: { id: string; brand: string; model: string; photoUrl: string | null };
}

const tripStatusLabels: Record<string, { label: string; color: string }> = {
  active:   { label: "В поездке",  color: "bg-blue-500" },
  finished: { label: "Завершена",  color: "text-green-600 border-green-200" },
  canceled: { label: "Отменена",   color: "text-red-500 border-red-200" },
};

// 4 required angles for finishing
const REQUIRED_ANGLES = ["FRONT", "REAR", "LEFT", "RIGHT"];

function TripsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const booked = searchParams.get("booked") === "true";
  const { isAuthenticated, token } = useAuthStore();
  const [tab, setTab] = useState("active");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Inline notification
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Pre-trip photos per reservation (reservationId → TripPhoto[])
  const [reservationPhotos, setReservationPhotos] = useState<Record<string, TripPhoto[]>>({});

  const loadReservationPhotos = useCallback(async (reservationIds: string[]) => {
    const headers: Record<string, string> = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
    const results = await Promise.all(
      reservationIds.map((rid) =>
        fetch(`/api/reservations/${rid}/photos`, { credentials: "include", headers })
          .then((r) => r.ok ? r.json() : [])
          .catch(() => [] as TripPhoto[])
      )
    );
    setReservationPhotos((prev) => {
      const next = { ...prev };
      reservationIds.forEach((rid, i) => { next[rid] = results[i] as TripPhoto[]; });
      return next;
    });
  }, []);

  // Photo dialogs
  const [startPhotoDialog, setStartPhotoDialog] = useState<{ tripId: string } | null>(null);
  const [endPhotoDialog, setEndPhotoDialog] = useState<{ tripId: string } | null>(null);
  const [startPhotos, setStartPhotos] = useState<TripPhoto[]>([]);
  const [endPhotos, setEndPhotos] = useState<TripPhoto[]>([]);

  // Finish trip map dialog
  const [finishDialog, setFinishDialog] = useState<{ tripId: string } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lon: number } | null>(null);
  const finishMapRef = useRef<HTMLDivElement>(null);
  const finishMapInstance = useRef<any>(null);
  const finishMarkerRef = useRef<any>(null);

  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async () => {
    const headers: Record<string, string> = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
    setLoading(true);
    try {
      const [resData, tripsData] = await Promise.all([
        fetch("/api/me/reservations", { credentials: "include", headers }).then((r) => r.json()),
        fetch("/api/me/trips", { credentials: "include", headers }).then((r) => r.json()),
      ]);
      const resList: Reservation[] = Array.isArray(resData) ? resData : [];
      setReservations(resList);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      if (resList.length > 0) {
        await loadReservationPhotos(resList.map((r) => r.id));
      }
    } catch {
      setReservations([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const fetchPhotos = async (tripId: string, phase: "START" | "END") => {
    const headers: Record<string, string> = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};
    const res = await fetch(`/api/trips/${tripId}/photos?phase=${phase}`, { credentials: "include", headers });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.photos) ? (data.photos as TripPhoto[]) : [];
  };

  const openStartDialog = async (tripId: string) => {
    const photos = await fetchPhotos(tripId, "START");
    setStartPhotos(photos);
    setStartPhotoDialog({ tripId });
  };

  const openEndDialog = async (tripId: string) => {
    const photos = await fetchPhotos(tripId, "END");
    setEndPhotos(photos);
    setEndPhotoDialog({ tripId });
  };

  const endRequiredDone = REQUIRED_ANGLES.every((a) => endPhotos.some((p) => p.angle === a));

  const handleCancel = async (id: string) => {
    setActionLoading(id + "-cancel");
    try {
      const res = await fetch(`/api/me/reservations/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders,
      });
      if (res.ok) await load();
    } finally {
      setActionLoading(null);
    }
  };

  // Init finish map when dialog opens
  useEffect(() => {
    if (!finishDialog) return;

    const defaultLat = 55.1644;
    const defaultLon = 61.4368;
    let destroyed = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const initMap = (lat: number, lon: number) => {
      if (destroyed || !finishMapRef.current) return;
      if (finishMapInstance.current) return;

      const doInit = () => {
        if (destroyed || !finishMapRef.current || !(window as any).ymaps) return;

        const map = new (window as any).ymaps.Map(finishMapRef.current, {
          center: [lat, lon],
          zoom: 15,
          controls: ["zoomControl", "geolocationControl"],
        });

        const marker = new (window as any).ymaps.Placemark(
          [lat, lon],
          { hintContent: "Место завершения" },
          { preset: "islands#redDotIconWithCaption", draggable: true }
        );

        marker.events.add("dragend", () => {
          const coords = marker.geometry.getCoordinates();
          setEndCoords({ lat: coords[0], lon: coords[1] });
        });

        map.events.add("click", (e: any) => {
          const coords = e.get("coords");
          marker.geometry.setCoordinates(coords);
          setEndCoords({ lat: coords[0], lon: coords[1] });
        });

        map.geoObjects.add(marker);
        finishMapInstance.current = map;
        finishMarkerRef.current = marker;
        setEndCoords({ lat, lon });
      };

      if ((window as any).ymaps?.ready) {
        (window as any).ymaps.ready(doInit);
      } else {
        pollInterval = setInterval(() => {
          if ((window as any).ymaps?.ready) {
            if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            (window as any).ymaps.ready(doInit);
          }
        }, 200);
      }
    };

    const timer = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
          () => initMap(defaultLat, defaultLon),
          { timeout: 3000 }
        );
      } else {
        initMap(defaultLat, defaultLon);
      }
    }, 150);

    return () => {
      destroyed = true;
      clearTimeout(timer);
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      if (finishMapInstance.current) {
        finishMapInstance.current.destroy();
        finishMapInstance.current = null;
        finishMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishDialog]);

  const handleFinish = async (id: string) => {
    setActionLoading(id + "-finish");
    try {
      const res = await fetch(`/api/me/trips/${id}/finish`, {
        method: "POST",
        credentials: "include",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(endCoords ? { endLat: endCoords.lat, endLon: endCoords.lon } : {}),
      });
      if (res.ok) {
        setFinishDialog(null);
        setEndCoords(null);
        setEndPhotoDialog(null);
        await load();
        setTab("history");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (id: string) => {
    setActionLoading(id + "-start");
    try {
      const res = await fetch(`/api/me/reservations/${id}/start`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        await load();
        setTab("history");
        router.push(`/trips?tripId=${data.tripId}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Car className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
          <p className="text-muted-foreground mb-6">Чтобы просмотреть поездки</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login"><Button variant="outline">Войти</Button></Link>
            <Link href="/register"><Button className="lavender-gradient text-white">Регистрация</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const activeTrips = trips.filter((t) => t.status === "active");
  const allActive = [...reservations, ...activeTrips];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Inline toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
              toast.type === "ok"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "ok"
              ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {booked && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Бронирование подтверждено!</p>
                <p className="text-sm text-green-700">Подойдите к авто за 15 минут</p>
              </div>
            </CardContent>
          </Card>
        )}

        <h1 className="text-3xl font-bold mb-6">Мои поездки</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />Активные
              {allActive.length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">{allActive.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-36 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : allActive.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Нет активных бронирований</h3>
                  <Link href="/search">
                    <Button className="lavender-gradient text-white">Найти авто</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {reservations.map((r) => {
                  const rPhotos = reservationPhotos[r.id] ?? [];
                  const uploadedAngles = new Set(rPhotos.map((p) => p.angle));
                  const allPhotosReady = (["FRONT", "REAR", "LEFT", "RIGHT"] as const).every((a) => uploadedAngles.has(a));

                  return (
                    <Card key={r.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 h-32 bg-muted flex-shrink-0">
                          {r.vehicle.photoUrl && (
                            <Image src={r.vehicle.photoUrl} alt={r.vehicle.model} fill className="object-cover" />
                          )}
                        </div>
                        <CardContent className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{r.vehicle.brand} {r.vehicle.model}</h3>
                              <p className="text-sm text-muted-foreground">Код: {r.code}</p>
                            </div>
                            <Badge className="bg-green-500">Активна</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Истекает: {format(new Date(r.expiresAt), "HH:mm", { locale: ru })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              <span>{r.vehicle.baseTariff.pricePerMinCents / 100} ₽/мин</span>
                            </div>
                          </div>

                          {/* Start photo upload — required before trip can begin */}
                          <div className="mb-4">
                            <StartPhotoUpload
                              reservationId={r.id}
                              photos={rPhotos}
                              onPhotosChange={(updated) =>
                                setReservationPhotos((prev) => ({ ...prev, [r.id]: updated }))
                              }
                            />
                          </div>

                          <div className="flex gap-2 items-center">
                            <div className="relative group">
                              <Button
                                className="lavender-gradient text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!allPhotosReady || actionLoading === r.id + "-start"}
                                onClick={() => handleStart(r.id)}
                              >
                                <Play className="h-4 w-4" />
                                {actionLoading === r.id + "-start" ? "Начинаем..." : "Начать поездку"}
                              </Button>
                              {!allPhotosReady && (
                                <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-10">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                                    Загрузи 4 фото авто
                                    <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              disabled={actionLoading === r.id + "-cancel"}
                              onClick={() => handleCancel(r.id)}
                            >
                              {actionLoading === r.id + "-cancel" ? "..." : "Отменить"}
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}

                {activeTrips.map((t) => (
                  <Card key={t.id} className="overflow-hidden border-blue-200">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-48 h-32 bg-muted flex-shrink-0">
                        {t.vehicle.photoUrl && (
                          <Image src={t.vehicle.photoUrl} alt={t.vehicle.model} fill className="object-cover" />
                        )}
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{t.vehicle.brand} {t.vehicle.model}</h3>
                            <p className="text-sm text-muted-foreground">
                              Начато: {format(new Date(t.startedAt), "HH:mm", { locale: ru })}
                            </p>
                          </div>
                          <Badge className="bg-blue-500">В поездке</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/5 gap-1.5"
                            onClick={() => openStartDialog(t.id)}
                          >
                            <Camera className="h-4 w-4" />
                            Фото при получении
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                            onClick={() => openEndDialog(t.id)}
                          >
                            <Flag className="h-4 w-4" />
                            Завершить поездку
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-36 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : trips.filter((t) => t.status !== "active").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  История поездок пуста
                </CardContent>
              </Card>
            ) : (
              trips.filter((t) => t.status !== "active").map((t) => (
                <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-48 h-32 bg-muted flex-shrink-0">
                      {t.vehicle.photoUrl && (
                        <Image src={t.vehicle.photoUrl} alt={t.vehicle.model} fill className="object-cover" />
                      )}
                    </div>
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{t.vehicle.brand} {t.vehicle.model}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(t.startedAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <Badge variant="outline" className={tripStatusLabels[t.status]?.color}>
                          {tripStatusLabels[t.status]?.label ?? t.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {t.durationMinutes != null && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{t.durationMinutes} мин</span>
                          </div>
                        )}
                        {t.amountCents != null && (
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <CreditCard className="h-4 w-4" />
                            <span>{t.amountCents / 100} ₽</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="flex items-center px-4 pb-4 md:pb-0">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=3c34dc81-b06e-4a4b-b07b-12d9405bf147&lang=ru_RU"
        strategy="afterInteractive"
      />

      {/* Start photos dialog */}
      <Dialog open={!!startPhotoDialog} onOpenChange={(open) => !open && setStartPhotoDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#7C3AED]" />
              Фото при получении авто
            </DialogTitle>
            <DialogDescription>
              Загрузи фото со всех сторон — это защитит тебя от спорных претензий
            </DialogDescription>
          </DialogHeader>
          {startPhotoDialog && (
            <PhotoUploadZone
              phase="START"
              tripId={startPhotoDialog.tripId}
              existingPhotos={startPhotos}
              onUploaded={(photo) => {
                setStartPhotos((prev) => [...prev.filter((p) => p.angle !== photo.angle), photo]);
                showToast("Фото загружено");
              }}
              onDeleted={(id) => setStartPhotos((prev) => prev.filter((p) => p.id !== id))}
              onError={(msg) => showToast(msg, "err")}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartPhotoDialog(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End photos dialog (step 1) */}
      <Dialog
        open={!!endPhotoDialog && !finishDialog}
        onOpenChange={(open) => { if (!open) setEndPhotoDialog(null); }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Завершение поездки — Шаг 1 из 2
            </DialogTitle>
            <DialogDescription>
              Загрузи минимум 4 фото (перед, зад, левый, правый бок) перед завершением
            </DialogDescription>
          </DialogHeader>
          {endPhotoDialog && (
            <PhotoUploadZone
              phase="END"
              tripId={endPhotoDialog.tripId}
              existingPhotos={endPhotos}
              onUploaded={(photo) => {
                setEndPhotos((prev) => [...prev.filter((p) => p.angle !== photo.angle), photo]);
                showToast("Фото загружено");
              }}
              onDeleted={(id) => setEndPhotos((prev) => prev.filter((p) => p.id !== id))}
              onError={(msg) => showToast(msg, "err")}
            />
          )}
          {!endRequiredDone && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Загрузи обязательные ракурсы: перед, зад, лево, право
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEndPhotoDialog(null)}>Отмена</Button>
            <Button
              className="lavender-gradient text-white gap-2"
              disabled={!endRequiredDone}
              onClick={() => {
                if (endPhotoDialog) setFinishDialog({ tripId: endPhotoDialog.tripId });
              }}
            >
              <MapPin className="h-4 w-4" />
              Далее — выбрать место
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish trip dialog with map (step 2) */}
      <Dialog
        open={!!finishDialog}
        onOpenChange={(open) => {
          if (!open) {
            setFinishDialog(null);
            setEndCoords(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Завершение поездки — Шаг 2 из 2
            </DialogTitle>
            <DialogDescription>
              Нажмите на карту или перетащите маркер, чтобы указать место парковки
            </DialogDescription>
          </DialogHeader>

          <div
            ref={finishMapRef}
            className="w-full rounded-lg overflow-hidden border"
            style={{ height: 320 }}
          />

          {endCoords && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{endCoords.lat.toFixed(5)}, {endCoords.lon.toFixed(5)}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinishDialog(null); setEndCoords(null); }}>
              Назад
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              disabled={!endCoords || actionLoading === finishDialog?.tripId + "-finish"}
              onClick={() => finishDialog && handleFinish(finishDialog.tripId)}
            >
              <Flag className="h-4 w-4" />
              {actionLoading === finishDialog?.tripId + "-finish" ? "Завершение..." : "Завершить здесь"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={null}>
      <TripsPageContent />
    </Suspense>
  );
}
