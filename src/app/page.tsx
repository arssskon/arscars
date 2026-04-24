"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/VehicleCard";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Car, MapPin, Smartphone, ChevronRight, CreditCard, ArrowRight, CheckCircle } from "lucide-react";

const stats = [
  { value: "500+", label: "Автомобилей" },
  { value: "5",    label: "Классов авто" },
  { value: "12",   label: "Городов" },
  { value: "3 ₽",  label: "от/минуту" },
];

const carClasses = [
  {
    name: "Эконом",
    price: "от 3 ₽/мин",
    examples: "Hyundai Solaris, Kia Rio, VW Polo",
    borderColor: "#10B981",
    desc: "Городская мобильность",
  },
  {
    name: "Комфорт",
    price: "от 7 ₽/мин",
    examples: "Toyota Camry, Skoda Octavia, Mazda 6",
    borderColor: "#B57EDC",
    desc: "Комфорт каждый день",
  },
  {
    name: "Бизнес",
    price: "от 12 ₽/мин",
    examples: "BMW 5 Series, Mercedes E-Class, Audi A6",
    borderColor: "#7C3AED",
    desc: "Статус и динамика",
  },
  {
    name: "Премиум",
    price: "от 20 ₽/мин",
    examples: "BMW 7 Series, Mercedes S-Class, Audi A8",
    borderColor: "#4C1D95",
    desc: "Исключительный уровень",
  },
  {
    name: "Элит",
    price: "от 35 ₽/мин",
    examples: "Porsche 911, Range Rover, Mercedes AMG GT",
    borderColor: "#1F1135",
    desc: "За пределами обычного",
  },
];

const benefits = [
  {
    icon: CreditCard,
    title: "Любой бюджет",
    description: "Автомобили от 3 до 35 ₽/мин. Платите только за время поездки.",
  },
  {
    icon: CheckCircle,
    title: "Честные тарифы",
    description: "Никаких скрытых платежей. Стоимость видна до начала поездки.",
  },
  {
    icon: Car,
    title: "Большой выбор",
    description: "500+ автомобилей 20+ марок. Всегда есть свободное авто рядом.",
  },
];

const steps = [
  { step: "01", title: "Выбери класс и авто",       desc: "Фильтруй по цене и классу — от 3 до 35 ₽/мин",     icon: MapPin },
  { step: "02", title: "Забронируй онлайн",          desc: "15 минут бронь бесплатно. Подтвердите за секунды",  icon: Smartphone },
  { step: "03", title: "Езди и плати поминутно",     desc: "Тариф от 3 до 35 ₽/мин. Платите только за время",  icon: Car },
];

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

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #B57EDC 100%)" }}
      >
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 bg-lavender" />
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full blur-2xl opacity-20 bg-lavender-light" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30">
              <Car className="h-4 w-4" />
              Каршеринг для всех классов
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              Каршеринг для всех.<br />
              <span className="text-lavender-light">Автомобиль от 3 ₽/мин</span>
            </h1>

            <p className="text-xl text-white/80 max-w-2xl">
              500+ автомобилей 5 классов в вашем городе. Эконом, Комфорт, Бизнес, Премиум, Элит.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/search">
                <Button size="lg"
                  className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-white hover:bg-lavender-pale text-lavender-deep font-semibold border-0"
                >
                  <MapPin className="h-5 w-5" />Найти автомобиль
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline"
                  className="w-full sm:w-auto gap-2 h-14 px-8 text-lg border-white/50 bg-white/10 text-white hover:bg-white/20"
                >
                  Смотреть тарифы<ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="py-14 bg-lavender-pale">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl p-6 text-center shadow-[0_4px_20px_rgba(181,126,220,0.10)]"
              >
                <div className="text-3xl md:text-4xl font-bold text-lavender-deep mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAR CLASSES ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-lavender-pale text-lavender-deep">
              Классы автомобилей
            </span>
            <h2 className="text-4xl font-bold mb-4 text-lavender-dark">
              Автомобиль для каждой задачи
            </h2>
            <p className="text-lg text-gray-500">
              От экономного до элитного — выбери автомобиль под свои потребности и бюджет
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {carClasses.map((c) => (
              <div
                key={c.name}
                className="bg-white rounded-2xl p-5 border-l-4 transition-all duration-200
                  hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(181,126,220,0.25)]
                  shadow-[0_2px_12px_rgba(181,126,220,0.08)]"
                style={{ borderLeftColor: c.borderColor }}
              >
                <p className="font-bold text-base mb-2" style={{ color: "#1F1135" }}>{c.name}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3 bg-lavender">
                  {c.price}
                </span>
                <p className="text-xs mb-1 text-gray-500">{c.desc}</p>
                <p className="text-xs leading-relaxed text-gray-500">{c.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VEHICLES ────────────────────────────────────────── */}
      <section className="py-24 bg-lavender-pale">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-lavender-light text-lavender-deep">
                Автопарк
              </span>
              <h2 className="text-4xl font-bold text-lavender-dark">Популярные модели</h2>
            </div>
            <Link href="/search">
              <Button variant="ghost" className="gap-2 font-medium text-lavender-deep hover:text-lavender-dark hover:bg-lavender-light">
                Все автомобили<ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-lavender-pale text-lavender-deep">
              Как это работает
            </span>
            <h2 className="text-4xl font-bold mb-4 text-lavender-dark">Три простых шага</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl p-8 text-center h-full shadow-[0_4px_20px_rgba(181,126,220,0.12)]">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6
                    bg-lavender text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-lavender-pale">
                    <item.icon className="h-7 w-7 text-lavender" />
                  </div>
                  <h3 className="font-bold text-xl mb-3" style={{ color: "#1F1135" }}>{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-lavender-light" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-lavender-light">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-lavender-pale text-lavender-deep">
              Почему мы
            </span>
            <h2 className="text-4xl font-bold mb-4 text-lavender-dark">Почему arscars</h2>
            <p className="text-lg text-gray-500">
              arscars — коммерческий каршеринг с автопарком более 500 автомобилей разных классов
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-2xl p-6 transition-all duration-200 group
                  shadow-[0_4px_20px_rgba(181,126,220,0.10)]
                  hover:shadow-[0_8px_30px_rgba(181,126,220,0.20)]"
                style={{ borderTop: "3px solid #B57EDC" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderTopColor = "#7C3AED"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderTopColor = "#B57EDC"; }}
              >
                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4 bg-lavender-pale">
                  <b.icon className="h-6 w-6 text-lavender" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-lavender-dark">{b.title}</h3>
                <p className="text-gray-500">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div
            className="rounded-3xl p-12 md:p-16 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #B57EDC 100%)" }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 bg-lavender-light" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Готовы к поездке?</h2>
              <p className="text-xl text-white/85 mb-8">
                Зарегистрируйтесь и получите доступ к 500+ автомобилям за 2 минуты
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg"
                    className="h-14 px-8 text-lg bg-white hover:bg-lavender-pale text-lavender-deep font-semibold border-0"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />Создать аккаунт
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline"
                    className="h-14 px-8 text-lg border-white/50 bg-white/10 text-white hover:bg-white/20"
                  >
                    Смотреть авто
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
