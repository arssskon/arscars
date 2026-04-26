"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { VehicleCard } from "@/components/VehicleCard";
import { GlassCard } from "@/components/ui/glass/GlassCard";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { GlassBadge } from "@/components/ui/glass/GlassBadge";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Car, MapPin, CalendarCheck, CreditCard, ChevronRight, ArrowRight } from "lucide-react";

const stats = [
  { value: "500+",  label: "Автомобилей" },
  { value: "5",     label: "Классов авто" },
  { value: "12",    label: "Городов" },
  { value: "3 мин", label: "До начала поездки" },
];

const carClasses = [
  {
    name: "Эконом",
    price: "от 3 ₽/мин",
    examples: "Hyundai Solaris, Kia Rio, VW Polo",
    variant: "success" as const,
  },
  {
    name: "Комфорт",
    price: "от 7 ₽/мин",
    examples: "Toyota Camry, Skoda Octavia, Mazda 6",
    variant: "lavender" as const,
  },
  {
    name: "Бизнес",
    price: "от 12 ₽/мин",
    examples: "BMW 5 Series, Mercedes E-Class, Audi A6",
    variant: "warning" as const,
  },
  {
    name: "Премиум",
    price: "от 20 ₽/мин",
    examples: "BMW 7 Series, Mercedes S-Class, Audi A8",
    variant: "neutral" as const,
  },
  {
    name: "Элит",
    price: "от 35 ₽/мин",
    examples: "Porsche 911, Range Rover, AMG GT",
    variant: "danger" as const,
  },
];

const steps = [
  { step: 1, title: "Выбери класс",   icon: Car,           desc: "Фильтруй по бюджету и типу авто" },
  { step: 2, title: "Забронируй",     icon: CalendarCheck, desc: "15 минут бронь бесплатно, без предоплаты" },
  { step: 3, title: "Езди и плати",   icon: CreditCard,    desc: "Поминутный тариф, оплата после поездки" },
];

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const sectionProps = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function HomePage() {
  const [featured, setFeatured] = useState<VehicleWithDetails[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFeatured(data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "#B57EDC" }}
        />
        <div
          className="absolute bottom-20 left-20 w-64 h-64 rounded-full blur-2xl opacity-20"
          style={{ background: "#DDD6FE" }}
        />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              <GlassBadge variant="lavender">
                <Car className="h-3.5 w-3.5" />
                Каршеринг нового поколения
              </GlassBadge>

              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight"
                style={{ color: "#1A1035" }}
              >
                Автомобиль<br />
                для каждой<br />
                задачи
              </h1>

              <p className="text-base max-w-md" style={{ color: "var(--text-secondary)" }}>
                500+ авто · 5 классов · от 3 ₽/мин. Бронируй онлайн за 2 минуты.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/search">
                  <GlassButton variant="primary" size="lg">
                    <MapPin className="h-5 w-5" />
                    Найти автомобиль
                  </GlassButton>
                </Link>
                <Link href="/about">
                  <GlassButton variant="ghost" size="lg">
                    Смотреть тарифы
                    <ArrowRight className="h-5 w-5" />
                  </GlassButton>
                </Link>
              </div>
            </motion.div>

            {/* Right column — car image + floating panel */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="hidden lg:flex justify-center items-center relative"
            >
              <div
                className="relative"
                style={{ filter: "drop-shadow(0 20px 60px rgba(181,126,220,0.45))" }}
              >
                <Image
                  src="/hero-car.png"
                  alt="arscars — автомобиль"
                  width={820}
                  height={700}
                  priority
                  className="w-full max-w-[820px] object-contain"
                />
              </div>
              <div className="absolute top-4 right-0">
                <GlassPanel floating className="min-w-[220px]">
                  <div className="flex gap-6 justify-center">
                    {[
                      { val: "500+", label: "авто" },
                      { val: "5",    label: "классов" },
                      { val: "3 ₽",  label: "/мин" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-xl font-black text-lavender-600">{s.val}</div>
                        <div className="text-xs text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <motion.section {...sectionProps} className="py-14">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={itemVariants}>
                <div className="glass rounded-2xl p-6 text-center">
                  <div className="text-4xl font-black text-lavender-600 mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <motion.section {...sectionProps} className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-lavender-900 mb-3">Как это работает</h2>
            <p style={{ color: "var(--text-secondary)" }}>Три простых шага до поездки</p>
          </div>
          <motion.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((item) => (
              <motion.div key={item.step} variants={itemVariants}>
                <GlassCard hover className="text-center h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-lavender-400 text-white font-bold text-lg flex items-center justify-center">
                      {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-lavender-50 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-lavender-600" />
                    </div>
                    <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {item.desc}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── CAR CLASSES ───────────────────────────────────────────────── */}
      <motion.section {...sectionProps} className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-lavender-900 mb-3">Автопарк для любых задач</h2>
          </div>
          {/* mobile: horizontal scroll; desktop: 5-col grid */}
          <div className="flex gap-4 overflow-x-auto snap-x pb-4 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
            {carClasses.map((c) => (
              <div key={c.name} className="snap-start min-w-[200px] md:min-w-0">
                <GlassCard hover className="h-full flex flex-col gap-3 p-5">
                  <GlassBadge variant={c.variant}>{c.name}</GlassBadge>
                  <div className="text-2xl font-bold text-lavender-600">{c.price}</div>
                  <p className="text-sm text-gray-500 flex-1">{c.examples}</p>
                  <Link href={`/search?class=${c.name}`}>
                    <GlassButton variant="outline" size="sm" className="w-full">
                      Смотреть
                    </GlassButton>
                  </Link>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── FEATURED VEHICLES ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <motion.section {...sectionProps} className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-lavender-900">Популярные модели</h2>
              <Link href="/search">
                <GlassButton variant="ghost" size="sm">
                  Все автомобили <ChevronRight className="h-4 w-4" />
                </GlassButton>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <motion.section {...sectionProps} className="py-24">
        <div className="container mx-auto px-4 space-y-24">

          {/* Block 1 — Booking */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <GlassPanel title="Бронирование" floating>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
                    <MapPin className="h-5 w-5 text-lavender-400 shrink-0" />
                    <span className="text-sm font-medium">Челябинск, ул. Ленина, 34</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
                    <CalendarCheck className="h-5 w-5 text-lavender-400 shrink-0" />
                    <span className="text-sm font-medium">Сегодня, 14:30 → 16:00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-lavender-100/60">
                    <span className="text-sm font-semibold text-lavender-900">Итого</span>
                    <span className="text-lg font-black text-lavender-600">270 ₽</span>
                  </div>
                  <div className="w-full py-3 rounded-full bg-lavender-400 text-white text-sm font-semibold text-center">
                    Подтвердить
                  </div>
                </div>
              </GlassPanel>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <GlassBadge variant="lavender">Быстро и удобно</GlassBadge>
              <h3 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Бронирование за 2 минуты
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Выберите автомобиль, укажите время и подтвердите. 15 минут бесплатной брони — без предоплаты.
              </p>
            </div>
          </div>

          {/* Block 2 — Payment */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <GlassBadge variant="success">Без лишних сложностей</GlassBadge>
              <h3 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                Оплата любым способом
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Банковская карта, СБП, Apple Pay или Google Pay. Оплата только после завершения поездки.
              </p>
            </div>
            <GlassPanel title="Способы оплаты" floating>
              <div className="space-y-3">
                {[
                  { label: "•••• 4242", tag: "Основная" },
                  { label: "СБП",       tag: "" },
                  { label: "Apple Pay", tag: "" },
                ].map((m, i) => (
                  <div
                    key={m.label}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      i === 0
                        ? "bg-lavender-100/60 border border-lavender-300/30"
                        : "bg-white/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{m.label}</span>
                    {m.tag && (
                      <span className="text-xs text-lavender-600 font-semibold">{m.tag}</span>
                    )}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Block 3 — Trip history */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <GlassPanel title="История поездок" floating>
                <div className="space-y-3">
                  {[
                    { car: "BMW 5 Series", date: "23 апр", price: "540 ₽" },
                    { car: "Toyota Camry", date: "20 апр", price: "312 ₽" },
                    { car: "Kia Rio",      date: "18 апр", price: "189 ₽" },
                  ].map((t) => (
                    <div
                      key={t.date}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/50"
                    >
                      <div>
                        <div className="text-sm font-semibold">{t.car}</div>
                        <div className="text-xs text-gray-500">{t.date}</div>
                      </div>
                      <div className="text-sm font-bold text-lavender-600">{t.price}</div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <GlassBadge variant="warning">Всё под рукой</GlassBadge>
              <h3 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                История поездок
              </h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Все поездки, оплаты и документы в одном месте. Скачайте чек в любой момент.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <motion.section {...sectionProps} className="py-24">
        <div className="container mx-auto px-4">
          <div
            className="relative overflow-hidden rounded-3xl text-center py-16 px-8"
            style={{
              background: "linear-gradient(135deg, #6D28D9 0%, #4C1D95 60%, #3B1678 100%)",
              boxShadow: "0 20px 60px rgba(76,29,149,0.40), 0 4px 16px rgba(76,29,149,0.25)",
            }}
          >
            {/* decorative blobs */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
              style={{ background: "#B57EDC", filter: "blur(40px)" }}
            />
            <div
              className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-15"
              style={{ background: "#DDD6FE", filter: "blur(32px)" }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 drop-shadow-sm">
                Начни ездить сегодня
              </h2>
              <p className="text-lavender-200 text-base mb-8 opacity-90">
                Регистрация занимает 3 минуты
              </p>
              <Link href="/register">
                <GlassButton
                  variant="ghost"
                  size="lg"
                  className="border border-white/30 text-white hover:bg-white/20"
                >
                  <CreditCard className="h-5 w-5" />
                  Создать аккаунт
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

    </div>
  );
}
