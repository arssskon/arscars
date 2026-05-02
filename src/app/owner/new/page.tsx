"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { MapPicker } from "@/components/ui/MapPicker";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/admin/Toast";
import { Plus, X } from "lucide-react";

const CLASSES = ["Эконом", "Комфорт", "Бизнес", "Премиум", "Элит"];
const TRANSMISSIONS = [{ value: "AT", label: "Автомат" }, { value: "MT", label: "Механика" }];
const FUELS = [
  { value: "petrol", label: "Бензин" },
  { value: "diesel", label: "Дизель" },
  { value: "electric", label: "Электро" },
  { value: "hybrid", label: "Гибрид" },
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

const initial: FormData = {
  make: "", model: "", year: "", color: "", plateNumber: "",
  vehicleClass: "Эконом", transmission: "AT", fuelType: "petrol",
  photoUrls: [""], description: "", ownerPhone: "",
  pricePerMinute: "", minCharge: "", address: "",
  latitude: "", longitude: "", availableFrom: "", availableTo: "",
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

export default function OwnerNewPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.replace("/login?redirect=/owner/new");
    return null;
  }

  const set = (field: keyof FormData, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  const setPhoto = (i: number, val: string) =>
    setForm((p) => {
      const urls = [...p.photoUrls];
      urls[i] = val;
      return { ...p, photoUrls: urls };
    });

  const addPhoto = () =>
    setForm((p) => ({ ...p, photoUrls: [...p.photoUrls, ""] }));

  const removePhoto = (i: number) =>
    setForm((p) => ({ ...p, photoUrls: p.photoUrls.filter((_, idx) => idx !== i) }));

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/listings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          pricePerMinute: Number(form.pricePerMinute),
          minCharge: Number(form.minCharge),
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          photoUrls: form.photoUrls.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error || "Ошибка"); return; }
      success("Заявка отправлена! Мы проверим её в течение 24 часов.");
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10"
      style={{ background: "var(--page-bg)" }}>
      <div className="w-full max-w-[560px]">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s === step
                    ? "bg-lavender-400 text-white shadow-lg shadow-lavender-400/30"
                    : s < step
                    ? "bg-lavender-200 text-lavender-800"
                    : "bg-lavender-100/70 text-lavender-300"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 rounded ${s < step ? "bg-lavender-400" : "bg-lavender-200/60"}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Шаг {step} из 3</p>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <GlassPanel floating className="space-y-4">

                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Об автомобиле</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Марка *</Label>
                        <input className={inputCls} placeholder="Toyota" value={form.make}
                          onChange={(e) => set("make", e.target.value)} />
                      </div>
                      <div>
                        <Label>Модель *</Label>
                        <input className={inputCls} placeholder="Camry" value={form.model}
                          onChange={(e) => set("model", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Год выпуска *</Label>
                        <input className={inputCls} type="number" min={2000} max={new Date().getFullYear()}
                          placeholder={String(new Date().getFullYear())} value={form.year}
                          onChange={(e) => set("year", e.target.value)} />
                      </div>
                      <div>
                        <Label>Цвет *</Label>
                        <input className={inputCls} placeholder="Белый" value={form.color}
                          onChange={(e) => set("color", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Гос. номер *</Label>
                      <input className={inputCls} placeholder="А123БВ77" value={form.plateNumber}
                        onChange={(e) => set("plateNumber", e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <Label>Класс автомобиля *</Label>
                      <select className={selectCls} value={form.vehicleClass}
                        onChange={(e) => set("vehicleClass", e.target.value)}>
                        {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Тип КПП *</Label>
                        <select className={selectCls} value={form.transmission}
                          onChange={(e) => set("transmission", e.target.value)}>
                          {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Тип топлива *</Label>
                        <select className={selectCls} value={form.fuelType}
                          onChange={(e) => set("fuelType", e.target.value)}>
                          {FUELS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <GlassButton variant="primary" onClick={() => {
                        if (!form.make || !form.model || !form.year || !form.color || !form.plateNumber) {
                          toastError("Заполните все обязательные поля"); return;
                        }
                        go(2);
                      }}>Далее →</GlassButton>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Фото и описание</h2>
                    <div>
                      <Label>Фото автомобиля (URL) *</Label>
                      <div className="space-y-2">
                        {form.photoUrls.map((url, i) => (
                          <div key={i} className="flex gap-2">
                            <input className={inputCls} placeholder="https://..." value={url}
                              onChange={(e) => setPhoto(i, e.target.value)} />
                            {i > 0 && (
                              <button onClick={() => removePhoto(i)}
                                className="text-white/40 hover:text-red-400 transition flex-shrink-0">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {form.photoUrls.length < 6 && (
                          <button onClick={addPhoto}
                            className="flex items-center gap-1 text-sm text-lavender-600 hover:text-lavender-800 transition">
                            <Plus className="h-4 w-4" /> Добавить фото
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Описание (необязательно)</Label>
                      <div className="relative">
                        <textarea
                          className={`${inputCls} resize-none`} rows={3}
                          maxLength={500} placeholder="Расскажите об автомобиле..."
                          value={form.description}
                          onChange={(e) => set("description", e.target.value)}
                        />
                        <span className="absolute bottom-2 right-3 text-lavender-300 text-xs">
                          {form.description.length}/500
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label>Ваш номер телефона *</Label>
                      <input className={inputCls} type="tel" placeholder="+7 (999) 000-00-00"
                        value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
                    </div>
                    <div className="pt-2 flex gap-3 justify-between">
                      <GlassButton variant="ghost" onClick={() => go(1)}>← Назад</GlassButton>
                      <GlassButton variant="primary" onClick={() => {
                        if (!form.photoUrls[0] || !form.ownerPhone) {
                          toastError("Добавьте фото и телефон"); return;
                        }
                        go(3);
                      }}>Далее →</GlassButton>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Цена и местоположение</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Цена за минуту, ₽ *</Label>
                        <input className={inputCls} type="number" min={1} placeholder="5"
                          value={form.pricePerMinute} onChange={(e) => set("pricePerMinute", e.target.value)} />
                      </div>
                      <div>
                        <Label>Мин. списание, ₽ *</Label>
                        <input className={inputCls} type="number" min={10} placeholder="50"
                          value={form.minCharge} onChange={(e) => set("minCharge", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Адрес выдачи *</Label>
                      <input className={inputCls} placeholder="Город, улица, дом"
                        value={form.address} onChange={(e) => set("address", e.target.value)} />
                    </div>
                    <div>
                      <Label>Местоположение на карте</Label>
                      <MapPicker
                        lat={form.latitude}
                        lon={form.longitude}
                        onChange={(lat, lon) => setForm((p) => ({ ...p, latitude: lat, longitude: lon }))}
                        onAddressChange={(addr) => setForm((p) => ({ ...p, address: p.address || addr }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Доступно с</Label>
                        <input className={inputCls} type="date"
                          value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />
                      </div>
                      <div>
                        <Label>Доступно по</Label>
                        <input className={inputCls} type="date"
                          value={form.availableTo} onChange={(e) => set("availableTo", e.target.value)} />
                      </div>
                    </div>
                    <div className="pt-2 flex gap-3 justify-between">
                      <GlassButton variant="ghost" onClick={() => go(2)}>← Назад</GlassButton>
                      <GlassButton variant="primary" disabled={loading} onClick={() => {
                        if (!form.pricePerMinute || !form.minCharge || !form.address) {
                          toastError("Заполните цену и адрес"); return;
                        }
                        handleSubmit();
                      }}>
                        {loading ? "Отправка..." : "Отправить на модерацию"}
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
