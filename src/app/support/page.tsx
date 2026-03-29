import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MessageCircle, Clock, MapPin, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Как начать поездку?",
    a: "Найдите автомобиль на карте, нажмите «Забронировать» на странице автомобиля. После подтверждения у вас есть 15 минут, чтобы подойти к машине. В разделе «Мои поездки» нажмите «Начать».",
  },
  {
    q: "Как завершить поездку?",
    a: "В разделе «Мои поездки» → активная поездка → «Завершить поездку». Укажите на карте место парковки. Стоимость рассчитывается автоматически по тарифу.",
  },
  {
    q: "Что делать, если автомобиль повреждён?",
    a: "Немедленно позвоните на горячую линию +7 982 344 38 82. Не начинайте поездку на повреждённом автомобиле. Все автомобили застрахованы по КАСКО.",
  },
  {
    q: "Можно ли отменить бронирование?",
    a: "Да. В разделе «Мои поездки» нажмите «Отменить» рядом с активным бронированием. Отмена бесплатна в любой момент до начала поездки.",
  },
  {
    q: "Как работает оплата?",
    a: "Оплата начисляется за фактическое время поездки (в минутах) по тарифу автомобиля. Минимальная сумма указана в карточке каждого автомобиля.",
  },
  {
    q: "Где можно оставить автомобиль?",
    a: "Автомобиль можно оставить в зоне обслуживания: Челябинск и Екатеринбург. При завершении поездки вы указываете место парковки на карте.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Поддержка</h1>
          <p className="text-xl text-muted-foreground">Мы готовы помочь в любое время</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">

          <section className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Phone,
                title: "Телефон",
                lines: ["+7 982 344 38 82", "Горячая линия 24/7"],
                note: "Для срочных вопросов",
              },
              {
                icon: Mail,
                title: "Email",
                lines: ["support@arscars.ru", "Ответ в течение 2 часов"],
                note: "Для общих вопросов",
              },
              {
                icon: MessageCircle,
                title: "Telegram",
                lines: ["@arscars_support", "Быстрые ответы"],
                note: "Пн–Вс, 8:00–22:00",
              },
            ].map(({ icon: Icon, title, lines, note }) => (
              <Card key={title}>
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  {lines.map((l) => (
                    <p key={l} className="text-sm text-muted-foreground">{l}</p>
                  ))}
                  <p className="text-xs text-primary mt-2">{note}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 flex gap-4">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Время работы поддержки</h3>
                    <p className="text-sm text-muted-foreground">Телефон: круглосуточно</p>
                    <p className="text-sm text-muted-foreground">Telegram / Email: 8:00–22:00</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex gap-4">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Зоны обслуживания</h3>
                    <p className="text-sm text-muted-foreground">Челябинск — радиус 25 км</p>
                    <p className="text-sm text-muted-foreground">Екатеринбург — радиус 25 км</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Частые вопросы</h2>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <Card key={q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-start justify-between gap-2">
                      <span>{q}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
