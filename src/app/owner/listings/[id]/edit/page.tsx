"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/admin/Toast";
import { Plus, X } from "lucide-react";

const CLASSES = ["Эконом", "Комфорт", "Бизнес", "Премиум", "Элит"];
const TRANSMISSIONS = [{ value: "AT", label: "Автомат" }, { value: "MT", label: "Механика" }];
const FUELS = [
  { value: "petrol", label: "Бензин" }, { value: "diesel", label: "Дизель" },
  { value: "electric", label: "Электро" }, { value: "hybrid", label: "Гибрид" },
];

const inputCls =
  "w-full bg-white/50 backdrop-blur border border-lavender-200 text-[#1A1035] placeholder-[#9CA3AF] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400 transition";
const selectCls =
  "w-full bg-white/50 backdrop-blur border border-lavender-200 text-[#1A1035] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lavender-400/40 appearance-none cursor-pointer";

interface FormData {
  make: string; model: string; year: string; color: string; plateNumber: string;
  vehicleClass: string; transmission: string; fuelType: string;
  photoUrls: string[]; description: string; ownerPhone: string;
  pricePerMinute: string; minCharge: string; address: string;
  latitude: string; longitude: string; availableFrom: string; availableTo: string;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.replace("/login?redirect=/owner/dashboard");
    return null;
  }

  useEffect(() => {
    fetch("/api/owner/listings", { credentials: "include" })
      .then((r) => r.json())
      .then((data: Array<{ id: string; status: string; make: string; model: string; year: number; color: string; plateNumber: string; vehicleClass: string; transmission: string; fuelType: string; photoUrls: string[]; description: string | null; ownerPhone: string; pricePerMinute: number; minCharge: number; address: string | null; latitude: number | null; longitude: number | null; availableFrom: string | null; availableTo: string | null }>) => {
        const listing = data.find((l) => l.id === id);
        if (!listing) { router.replace("/owner/dashboard"); return; }
        if (listing.status !== "PENDING" && listing.status !== "REJECTED") {
          router.replace("/owner/dashboard"); return;
        }
        setForm({
          make: listing.make, model: listing.model, year: String(listing.year),
          color: listing.color, plateNumber: listing.plateNumber,
          vehicleClass: listing.vehicleClass, transmission: listing.transmission,
          fuelType: listing.fuelType, photoUrls: listing.photoUrls.length ? listing.photoUrls : [""],
          description: listing.description ?? "", ownerPhone: listing.ownerPhone,
          pricePerMinute: String(listing.pricePerMinute), minCharge: String(listing.minCharge),
          address: listing.address ?? "",
          latitude: listing.latitude ? String(listing.latitude) : "",
          longitude: listing.longitude ? String(listing.longitude) : "",
          availableFrom: listing.availableFrom ? listing.availableFrom.slice(0, 10) : "",
          availableTo: listing.availableTo ? listing.availableTo.slice(0, 10) : "",
        });
      })
      .catch(() => router.replace("/owner/dashboard"))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (fetching || !form) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="text-white/60">Загрузка...</div>
      </div>
    );
  }

  const set = (field: keyof FormData, val: string) => setForm((p) => p ? { ...p, [field]: val } : p);
  const setPhoto = (i: number, val: string) => setForm((p) => {
    if (!p) return p;
    const urls = [...p.photoUrls]; urls[i] = val; return { ...p, photoUrls: urls };
  });
  const addPhoto = () => setForm((p) => p ? { ...p, photoUrls: [...p.photoUrls, ""] } : p);
  const removePhoto = (i: number) => setForm((p) => p ? { ...p, photoUrls: p.photoUrls.filter((_, idx) => idx !== i) } : p);
  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  const handleSubmit = async () => {
    if (!form) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/listings/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          pricePerMinute: Number(form.pricePerMinute),
          minCharge: Number(form.minCharge),
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          photoUrls: form.photoUrls.filter(Boolean),
        }),
      });
      if (!res.ok) { const d = await res.json(); toastError(d.error || "Ошибка"); return; }
      success("Заявка обновлена и отправлена на повторную модерацию");
      router.push("/owner/dashboard");
    } catch {
      toastError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{children}</label>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10" style={{ background: "var(--page-bg)" }}>
      <div className="w-full max-w-[560px]">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step ? "bg-lavender-400 text-white shadow-lg shadow-lavender-400/30"
                  : s < step ? "bg-lavender-200 text-lavender-800" : "bg-lavender-100/70 text-lavender-300"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-8 rounded ${s < step ? "bg-lavender-400" : "bg-lavender-200/60"}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Шаг {step} из 3 · Редактирование</p>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}>
              <GlassPanel floating className="space-y-4">

                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Об автомобиле</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Марка *</Label><input className={inputCls} value={form.make} onChange={(e) => set("make", e.target.value)} /></div>
                      <div><Label>Модель *</Label><input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Год выпуска *</Label><input className={inputCls} type="number" min={2000} max={new Date().getFullYear()} value={form.year} onChange={(e) => set("year", e.target.value)} /></div>
                      <div><Label>Цвет *</Label><input className={inputCls} value={form.color} onChange={(e) => set("color", e.target.value)} /></div>
                    </div>
                    <div><Label>Гос. номер *</Label><input className={inputCls} value={form.plateNumber} onChange={(e) => set("plateNumber", e.target.value.toUpperCase())} /></div>
                    <div><Label>Класс</Label><select className={selectCls} value={form.vehicleClass} onChange={(e) => set("vehicleClass", e.target.value)}>{CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>КПП</Label><select className={selectCls} value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>{TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                      <div><Label>Топливо</Label><select className={selectCls} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>{FUELS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
                    </div>
                    <div className="pt-2 flex justify-end"><GlassButton variant="primary" onClick={() => go(2)}>Далее →</GlassButton></div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Фото и описание</h2>
                    <div>
                      <Label>Фото (URL) *</Label>
                      <div className="space-y-2">
                        {form.photoUrls.map((url, i) => (
                          <div key={i} className="flex gap-2">
                            <input className={inputCls} placeholder="https://..." value={url} onChange={(e) => setPhoto(i, e.target.value)} />
                            {i > 0 && <button onClick={() => removePhoto(i)} className="text-white/40 hover:text-red-400 transition"><X className="h-4 w-4" /></button>}
                          </div>
                        ))}
                        {form.photoUrls.length < 6 && <button onClick={addPhoto} className="flex items-center gap-1 text-sm text-lavender-600 hover:text-lavender-800 transition"><Plus className="h-4 w-4" /> Добавить фото</button>}
                      </div>
                    </div>
                    <div>
                      <Label>Описание</Label>
                      <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} value={form.description} onChange={(e) => set("description", e.target.value)} />
                    </div>
                    <div><Label>Телефон *</Label><input className={inputCls} type="tel" value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} /></div>
                    <div className="pt-2 flex gap-3 justify-between">
                      <GlassButton variant="ghost" onClick={() => go(1)}>← Назад</GlassButton>
                      <GlassButton variant="primary" onClick={() => go(3)}>Далее →</GlassButton>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Цена и местоположение</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>₽/мин *</Label><input className={inputCls} type="number" min={1} value={form.pricePerMinute} onChange={(e) => set("pricePerMinute", e.target.value)} /></div>
                      <div><Label>Мин. ₽ *</Label><input className={inputCls} type="number" min={10} value={form.minCharge} onChange={(e) => set("minCharge", e.target.value)} /></div>
                    </div>
                    <div><Label>Адрес *</Label><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Широта</Label><input className={inputCls} type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></div>
                      <div><Label>Долгота</Label><input className={inputCls} type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Доступно с</Label><input className={inputCls} type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} /></div>
                      <div><Label>Доступно по</Label><input className={inputCls} type="date" value={form.availableTo} onChange={(e) => set("availableTo", e.target.value)} /></div>
                    </div>
                    <div className="pt-2 flex gap-3 justify-between">
                      <GlassButton variant="ghost" onClick={() => go(2)}>← Назад</GlassButton>
                      <GlassButton variant="primary" disabled={loading} onClick={handleSubmit}>
                        {loading ? "Сохранение..." : "Отправить на модерацию"}
                      </GlassButton>
                    </div>
                  </>
                )}

              </GlassPanel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
