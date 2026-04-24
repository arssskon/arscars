"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleCard } from "@/components/VehicleCard";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Car, MapPin, Clock, Shield, Smartphone, ChevronRight, Zap, CreditCard, ArrowRight, CheckCircle } from "lucide-react";

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
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800",
    desc: "Городская мобильность",
  },
  {
    name: "Комфорт",
    price: "от 7 ₽/мин",
    examples: "Toyota Camry, Skoda Octavia, Mazda 6",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    desc: "Комфорт каждый день",
  },
  {
    name: "Бизнес",
    price: "от 12 ₽/мин",
    examples: "BMW 5 Series, Mercedes E-Class, Audi A6",
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
    desc: "Статус и динамика",
  },
  {
    name: "Премиум",
    price: "от 20 ₽/мин",
    examples: "BMW 7 Series, Mercedes S-Class, Audi A8",
    border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800",
    desc: "Исключительный уровень",
  },
  {
    name: "Элит",
    price: "от 35 ₽/мин",
    examples: "Porsche 911, Range Rover, Mercedes AMG GT",
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
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
      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F1C2E 0%, #1E3A5F 100%)" }}
      >
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-400/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl space-y-8">
            <Badge className="gap-2 px-4 py-2 text-sm bg-primary/20 text-primary border border-primary/40">
              <Car className="h-4 w-4" />
              Каршеринг для всех классов
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              Каршеринг для всех.<br />
              <span className="text-blue-400">Автомобиль от 3 ₽/мин</span>
            </h1>
            <p className="text-xl text-blue-100/80 max-w-2xl">
              500+ автомобилей 5 классов в вашем городе. Эконом, Комфорт, Бизнес, Премиум, Элит.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/search">
                <Button size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white">
                  <MapPin className="h-5 w-5" />Найти автомобиль
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Смотреть тарифы<ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{s.value}</div>
                  <div className="text-sm text-blue-100/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Car Classes */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Классы автомобилей</Badge>
            <h2 className="text-4xl font-bold mb-4">Автомобиль для каждой задачи</h2>
            <p className="text-lg text-muted-foreground">
              От экономного до элитного — выбери автомобиль под свои потребности и бюджет
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {carClasses.map((c) => (
              <Card
                key={c.name}
                className={`border-0 shadow-lg hover:shadow-xl transition-shadow border-l-4 ${c.border}`}
              >
                <CardContent className="p-5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${c.badge}`}>
                    {c.name}
                  </span>
                  <p className="font-bold text-lg mb-1">{c.price}</p>
                  <p className="text-xs text-muted-foreground mb-2">{c.desc}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.examples}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4">Автопарк</Badge>
              <h2 className="text-4xl font-bold">Популярные модели</h2>
            </div>
            <Link href="/search">
              <Button variant="ghost" className="gap-2">Все автомобили<ChevronRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Как это работает</Badge>
            <h2 className="text-4xl font-bold mb-4">Три простых шага</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Выбери класс и авто", desc: "Фильтруй по цене и классу — от 3 до 35 ₽/мин", icon: MapPin },
              { step: "02", title: "Забронируй онлайн", desc: "15 минут бронь бесплатно. Подтвердите за секунды", icon: Smartphone },
              { step: "03", title: "Езди и плати поминутно", desc: "Тариф от 3 до 35 ₽/мин. Платите только за время", icon: Car },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                    <div className="h-16 w-16 rounded-2xl lavender-gradient flex items-center justify-center mx-auto mb-6">
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why arscars */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Почему мы</Badge>
            <h2 className="text-4xl font-bold mb-4">Почему arscars</h2>
            <p className="text-lg text-muted-foreground">
              arscars — коммерческий каршеринг с автопарком более 500 автомобилей разных классов
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl lavender-gradient flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                  <p className="text-muted-foreground">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="lavender-gradient border-0 overflow-hidden">
            <CardContent className="p-12 md:p-16 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Готовы к поездке?</h2>
                <p className="text-xl text-white/80 mb-8">
                  Зарегистрируйтесь и получите доступ к 500+ автомобилям за 2 минуты
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90">
                      <CreditCard className="mr-2 h-5 w-5" />Создать аккаунт
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white bg-white/10 text-white hover:bg-white/20">
                      Смотреть авто
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
