import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, Shield, Clock, GraduationCap, Zap, Star, CheckCircle, ArrowRight, Smartphone, CreditCard, ChevronRight } from "lucide-react";

const stats = [
  { icon: Car,    value: "10+",  label: "Автомобилей в парке" },
  { icon: MapPin, value: "2",    label: "Города присутствия" },
  { icon: Shield, value: "0",    label: "Страховых случаев" },
  { icon: Clock,  value: "24/7", label: "Поддержка" },
];

const models = [
  { name: "911 Carrera",  tag: "Спорт",        desc: "Легендарный заднеприводный спорткар" },
  { name: "Cayenne",      tag: "SUV",           desc: "Мощный внедорожник с характером" },
  { name: "Taycan",       tag: "Электро",       desc: "Будущее Porsche уже сегодня" },
  { name: "Panamera",     tag: "Гран-туризмо",  desc: "Роскошь и динамика в одном" },
];

const features = [
  { icon: Star,        title: "Только Porsche",     desc: "Весь парк — автомобили Porsche. Никаких компромиссов с качеством." },
  { icon: Zap,         title: "Мгновенный старт",   desc: "От регистрации до начала поездки — менее 5 минут." },
  { icon: Shield,      title: "Полная страховка",   desc: "КАСКО и ОСАГО включены в каждую поездку без доплат." },
  { icon: MapPin,      title: "Два города",         desc: "Челябинск и Екатеринбург — зоны покрытия по 25 км." },
  { icon: CheckCircle, title: "Прозрачный тариф",   desc: "Платите только за время. Все цены видны до начала аренды." },
  { icon: Clock,       title: "Поддержка 24/7",     desc: "Горячая линия работает круглосуточно без выходных." },
];

const steps = [
  { step: "01", title: "Найдите авто",   desc: "Откройте карту и выберите ближайший автомобиль",            icon: MapPin },
  { step: "02", title: "Забронируйте",   desc: "Подтвердите бронь — у вас будет 15 минут, чтобы подойти",  icon: Smartphone },
  { step: "03", title: "Начните",        desc: "Нажмите «Начать» в разделе «Мои поездки» и поехали!",      icon: Car },
  { step: "04", title: "Завершите",      desc: "Укажите место парковки на карте и оплатите по тарифу",      icon: CheckCircle },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">

      {/* Дипломный баннер */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary">
              <span className="font-semibold">Дипломный проект.</span> arscars — учебный проект, разработанный в рамках выпускной квалификационной работы. Все данные, тарифы и контакты являются демонстрационными.
            </p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 py-20 relative z-10 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm mb-6">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Премиальный каршеринг
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            О компании <span className="text-primary">arscars</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Современный каршеринг автомобилей Porsche в Челябинске и Екатеринбурге — без покупки, без обслуживания, без лишних формальностей
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="gap-2 h-14 px-8 text-lg lavender-gradient text-white hover:opacity-90">
                <MapPin className="h-5 w-5" /> Найти авто рядом
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg">
                Создать аккаунт <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="h-12 w-12 rounded-xl lavender-gradient flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Миссия */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Наша миссия</Badge>
              <h2 className="text-4xl font-bold mb-6">Porsche — доступнее, чем вы думаете</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                arscars создан для тех, кто ценит свободу передвижения и качество автомобиля. Мы предоставляем доступ к автомобилям Porsche без необходимости покупки и обслуживания.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Сервис работает в Челябинске и Екатеринбурге, охватывая ключевые районы обоих городов. Мы постоянно расширяем парк и географию присутствия.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {models.map(({ name, tag, desc }) => (
                <Card key={name} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="text-xs mb-3">{tag}</Badge>
                    <h3 className="font-bold mb-1">Porsche {name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Преимущества</Badge>
            <h2 className="text-4xl font-bold mb-4">Почему arscars</h2>
            <p className="text-lg text-muted-foreground">Мы сделали аренду премиальных автомобилей простой и доступной</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl lavender-gradient flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Процесс</Badge>
            <h2 className="text-4xl font-bold mb-4">Как это работает</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className="relative">
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl font-bold text-primary/10 mb-4">{step}</div>
                    <div className="h-16 w-16 rounded-2xl lavender-gradient flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-3">{title}</h3>
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </CardContent>
                </Card>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
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
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Готовы к первой поездке?</h2>
                <p className="text-xl text-white/80 mb-8">Зарегистрируйтесь и выберите свой Porsche прямо сейчас</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90">
                      <CreditCard className="mr-2 h-5 w-5" /> Создать аккаунт
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
