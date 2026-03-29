"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleCard } from "@/components/VehicleCard";
import type { VehicleWithDetails } from "@/lib/mock-data";
import { Car, MapPin, Clock, Shield, Smartphone, Star, ChevronRight, Zap, CreditCard, ArrowRight } from "lucide-react";

const features = [
  { icon: Smartphone, title: "Аренда через приложение", description: "Бронируйте и открывайте авто прямо с телефона" },
  { icon: Clock, title: "Поминутная оплата", description: "Платите только за время использования" },
  { icon: Shield, title: "Полная страховка", description: "Все автомобили застрахованы" },
  { icon: Zap, title: "Мгновенный доступ", description: "Откройте машину за секунды" },
];

const stats = [
  { value: "500+", label: "Автомобилей Porsche" },
  { value: "50K+", label: "Довольных клиентов" },
  { value: "4.9", label: "Средняя оценка" },
  { value: "24/7", label: "Поддержка" },
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
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Премиальный каршеринг
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Porsche<br /><span className="text-primary">по минутам</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Арендуйте легендарные автомобили Porsche прямо сейчас. Открывайте машину с телефона.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/search">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg lavender-gradient text-white hover:opacity-90">
                    <MapPin className="h-5 w-5" />Найти авто рядом
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg">
                    Начать бесплатно<ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-8 pt-4">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-bold text-primary">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-[4/3]">
                <Image src="https://images-porsche.imgix.net/-/media/1DBDC37E82084CF496EE48FCCE48BE0A_B3C2A87AF66E4046A12F32259A2BA221_911-gt3-side?w=2560&q=45&auto=format" alt="Porsche 911 GT3" fill className="object-contain" priority />
              </div>
              <Card className="absolute -bottom-8 -left-8 shadow-2xl border-0">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full lavender-gradient flex items-center justify-center"><Car className="h-6 w-6 text-white" /></div>
                  <div><div className="font-bold">Porsche 911 GT3</div><div className="text-sm text-muted-foreground">от 40 ₽/мин</div></div>
                  <Badge className="ml-2 bg-green-500">Доступен</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Почему мы</Badge>
            <h2 className="text-4xl font-bold mb-4">Каршеринг нового поколения</h2>
            <p className="text-lg text-muted-foreground">Мы сделали аренду премиальных автомобилей простой и доступной</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl lavender-gradient flex items-center justify-center mb-4"><f.icon className="h-6 w-6 text-white" /></div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4">Автопарк</Badge>
              <h2 className="text-4xl font-bold">Популярные модели</h2>
            </div>
            <Link href="/search"><Button variant="ghost" className="gap-2">Все автомобили<ChevronRight className="h-4 w-4" /></Button></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Как это работает</Badge>
            <h2 className="text-4xl font-bold mb-4">Три простых шага</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Найдите авто", desc: "Откройте карту и выберите ближайший автомобиль", icon: MapPin },
              { step: "02", title: "Забронируйте", desc: "Подтвердите бронь и откройте машину через приложение", icon: Smartphone },
              { step: "03", title: "Поехали!", desc: "Ключи внутри. Наслаждайтесь поездкой", icon: Car },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                    <div className="h-16 w-16 rounded-2xl lavender-gradient flex items-center justify-center mx-auto mb-6"><item.icon className="h-8 w-8 text-white" /></div>
                    <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"><ChevronRight className="h-8 w-8 text-primary/30" /></div>}
              </div>
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
                <p className="text-xl text-white/80 mb-8">Зарегистрируйтесь и получите 500 бонусных рублей</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register"><Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90"><CreditCard className="mr-2 h-5 w-5" />Создать аккаунт</Button></Link>
                  <Link href="/search"><Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white bg-white/10 text-white hover:bg-white/20">Смотреть авто</Button></Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
