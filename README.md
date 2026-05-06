# arscars

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1-fbf0df?logo=bun&logoColor=black)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)

**arscars** — P2P-платформа краткосрочной аренды автомобилей. Частные владельцы размещают свои автомобили, арендаторы находят и бронируют подходящий вариант. Администраторы управляют флотом, тарифами, верификацией водителей и модерацией объявлений.

🔗 **Демо:** [arscars.vercel.app](https://arscars.vercel.app)

---

## Стек технологий

| Уровень | Технологии |
|---------|-----------|
| Фреймворк | Next.js 15 (App Router, Server Components, Turbopack) |
| Язык | TypeScript 5.8 (strict mode) |
| Стилизация | Tailwind CSS 3 + Radix UI + дизайн-система Liquid Glass |
| ORM | Prisma 6 |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT в httpOnly-cookies + RBAC + Edge Middleware |
| Хранилище файлов | Vercel Blob |
| Карты | Yandex Maps API 2.1 |
| Клиентское состояние | Zustand 5 |
| Анимации | Framer Motion 12 |
| Пакетный менеджер / Runtime | Bun 1 |
| Деплой | Vercel |
| Линтер / Форматтер | Biome |

---

## Функциональность

### Арендатор (`driver`)
- Регистрация и вход (email / телефон + пароль)
- Каталог автомобилей с фильтрацией по классу, трансмиссии, типу топлива и цене
- Карта с кастомными маркерами-плашками (цена/мин), плавная навигация между объектами
- Страница детальной информации об автомобиле: технические характеристики, тариф, рейтинг, фото
- Загрузка и управление водительскими документами (паспорт, водительское удостоверение — до 10 МБ)
- Просмотр истории поездок и платежей
- Личный кабинет: профиль, настройки

### Владелец ТС (`owner`)
- Трёхшаговая форма подачи объявления: данные автомобиля → характеристики и тариф → местоположение на карте
- Интерактивный выбор местоположения через Yandex Maps (перетаскиваемый маркер + автоматическое геокодирование адреса)
- Личный кабинет с таблицей своих объявлений и статусами (`PENDING` / `APPROVED` / `REJECTED` / `SUSPENDED`)
- Редактирование и удаление объявлений в статусах `PENDING` и `REJECTED`

### Администратор (`admin`)
- **Дашборд** — сводные метрики платформы
- **Пользователи** — просмотр, управление ролями и статусами аккаунтов
- **Объявления владельцев** — модерация: одобрение/отклонение/приостановка; при одобрении автоматически создаётся запись автомобиля и тарифа
- **Автомобили** — управление флотом (статусы, тарифы, зоны)
- **Поездки** и **Бронирования** — просмотр и управление
- **Тарифы** — создание и редактирование тарифных планов
- **Инциденты** — регистрация и разбор (ДТП, штрафы, повреждения, эвакуация)
- **Сервисные зоны** — геозоны с правилами завершения поездки и штрафными тарифами
- **Верификация документов** — проверка документов водителей
- **Аудит-лог** — полный журнал действий администраторов

---

## Архитектура

### Структура проекта

```
arscars/
├── prisma/
│   ├── schema.prisma           # Схема БД (23 таблицы)
│   └── seed.ts                 # Начальное заполнение данными
├── src/
│   ├── middleware.ts            # Edge Middleware: охрана /admin/*
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Корневой layout
│   │   ├── page.tsx            # Главная (лендинг)
│   │   ├── search/             # Поиск + карта
│   │   ├── vehicles/[id]/      # Карточка автомобиля
│   │   ├── login/ register/    # Аутентификация
│   │   ├── profile/ settings/  # Личный кабинет арендатора
│   │   ├── trips/ payments/    # История поездок и платежей
│   │   ├── documents/          # Загрузка документов
│   │   ├── owner/              # Кабинет владельца ТС
│   │   │   ├── new/            # Форма нового объявления
│   │   │   ├── dashboard/      # Мои объявления
│   │   │   └── listings/[id]/  # Редактирование объявления
│   │   ├── admin/              # Панель администратора
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── vehicles/
│   │   │   ├── owner-listings/
│   │   │   ├── trips/
│   │   │   ├── reservations/
│   │   │   ├── tariffs/
│   │   │   ├── incidents/
│   │   │   ├── zones/
│   │   │   ├── documents/
│   │   │   └── audit/
│   │   └── api/                # REST API (Route Handlers)
│   │       ├── auth/           # login, register, me
│   │       ├── vehicles/       # Каталог + детали
│   │       ├── me/             # Профиль, документы, поездки, платежи
│   │       ├── owner/listings/ # CRUD объявлений владельца
│   │       ├── admin/          # Все admin-эндпоинты
│   │       └── upload/         # Загрузка файлов в Vercel Blob
│   ├── components/
│   │   ├── ui/glass/           # Дизайн-система Liquid Glass
│   │   │   ├── GlassButton.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── GlassPanel.tsx
│   │   │   └── GlassBadge.tsx
│   │   ├── ui/MapPicker.tsx    # Выбор точки на карте
│   │   ├── ui/ClassBadge.tsx   # Бейдж класса автомобиля
│   │   ├── VehicleCard.tsx     # Карточка авто (обычная и компактная)
│   │   ├── VehicleMap.tsx      # Карта с маркерами (Yandex Maps)
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── lib/
│       ├── prisma.ts           # Singleton Prisma Client
│       ├── auth.ts             # JWT: sign / verify
│       ├── user-guard.ts       # Верификация токена в API
│       ├── admin-guard.ts      # Проверка роли admin в API
│       ├── audit.ts            # Запись в audit_log
│       ├── store.ts            # Zustand: auth + search state
│       ├── mock-data.ts        # Типы и вспомогательные функции
│       └── utils.ts            # cn() и прочие утилиты
└── public/                     # Статические файлы (логотип, иконки)
```

### Ключевые архитектурные решения

**RBAC на двух уровнях:**
```
Запрос → Edge Middleware (быстрый декод JWT, проверка роли)
       → API Route Handler (полная верификация JWT через jsonwebtoken)
       → Prisma → PostgreSQL
```

- **Edge Middleware** (`middleware.ts`) защищает все маршруты `/admin/*` без обращения к БД — декодирует payload JWT на Edge Runtime
- **Серверные гарды** (`user-guard.ts`, `admin-guard.ts`) — полная криптографическая верификация подписи токена перед каждым запросом к данным

**Prisma + `db push`:** схема применяется автоматически при каждом деплое на Vercel через build-скрипт, миграционные файлы не используются в production.

---

## Схема базы данных

23 таблицы, 8 enum-типов:

| Таблица | Описание |
|---------|---------|
| `users` | Пользователи всех ролей |
| `roles` / `user_roles` | Роли: `driver`, `owner`, `support`, `admin` |
| `vehicles` | Автомобили флота и одобренные P2P |
| `vehicle_classes` | Классы: sport, luxury, suv, coupe, sedan |
| `transmissions` | Трансмиссии: AT, MT, PDK |
| `fuel_types` | Типы топлива: petrol, diesel, electric, hybrid |
| `tariffs` | Тарифные планы (цена за минуту в копейках, минимальное списание) |
| `vehicle_last_state` | Текущие координаты, уровень топлива/заряда |
| `vehicle_telemetry` | История телеметрии |
| `vehicle_status_history` | Лог смен статуса автомобиля |
| `reservations` | Бронирования (TTL 15 минут) |
| `trips` | Поездки: координаты, длительность, сумма |
| `payments` | Операции: preauth, capture, refund, adjustment |
| `owner_listings` | Объявления владельцев (PENDING → APPROVED/REJECTED/SUSPENDED) |
| `driver_profiles` / `driver_documents` | Верификация водителей |
| `zones` / `zone_rules` | Сервисные зоны с правилами и штрафными коэффициентами |
| `incidents` / `incident_media` | Инциденты с медиа-вложениями |
| `audit_log` | Журнал административных действий |

---

## Аутентификация

- JWT подписывается на сервере с помощью `jsonwebtoken` и записывается в `httpOnly`-cookie `auth-token` (недоступна JavaScript на клиенте)
- Payload токена: `{ userId, roles[], email, iat, exp }`
- Срок жизни настраивается через `JWT_EXPIRES_IN` (по умолчанию `7d`)
- Выход — удаление cookie без обращения к БД (stateless)
- Клиентский стор `useAuthStore` (Zustand, persist) хранит профиль пользователя для UI

---

## Быстрый старт

### Требования

- [Bun](https://bun.sh) ≥ 1.0
- PostgreSQL ≥ 14
- Node.js ≥ 20

### Установка

```bash
git clone https://github.com/arssskon/arscars.git
cd arscars
bun install
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных (обязательно)
DATABASE_POSTGRES_URL="postgresql://USER:PASSWORD@HOST:5432/arscars?schema=public"

# JWT (обязательно)
JWT_SECRET="your-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# Yandex Maps (карта не отобразится без ключа)
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-yandex-maps-api-key"

# Vercel Blob (загрузка файлов недоступна без токена)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# URL приложения
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Переменная | Обязательная | Описание |
|-----------|:-----------:|---------|
| `DATABASE_POSTGRES_URL` | ✅ | Строка подключения к PostgreSQL |
| `JWT_SECRET` | ✅ | Секрет для подписи JWT (≥32 символов) |
| `JWT_EXPIRES_IN` | — | Срок жизни токена (по умолчанию `7d`) |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | — | API-ключ Яндекс Карт |
| `BLOB_READ_WRITE_TOKEN` | — | Токен Vercel Blob для загрузки файлов |
| `NEXT_PUBLIC_APP_URL` | — | Базовый URL приложения |

### Настройка базы данных

```bash
# Создать таблицы (применить схему Prisma)
bun run db:push

# Заполнить справочные данные + создать тестовые аккаунты
bun run db:seed
```

После `seed` доступны тестовые аккаунты:
- Администратор: `admin@arscars.ru` / `admin123`
- Арендатор: `driver@arscars.ru` / `driver123`

### Запуск

```bash
bun dev
```

Приложение: [http://localhost:3000](http://localhost:3000)
Prisma Studio: `bun run db:studio` → [http://localhost:5555](http://localhost:5555)

---

## Деплой на Vercel

1. Создайте проект в [Vercel](https://vercel.com), подключите GitHub-репозиторий
2. Добавьте переменные окружения из таблицы выше в **Settings → Environment Variables**
3. Убедитесь, что `DATABASE_POSTGRES_URL` указывает на PostgreSQL, доступный из Vercel (Neon, Supabase, Railway и др.)
4. Деплой запустится автоматически. Схема БД применяется через build-скрипт:

```json
"build": "bunx prisma db push --accept-data-loss && next build"
```

---

## Полезные команды

```bash
bun dev                # Запуск dev-сервера (Turbopack)
bun run build          # Продакшн-сборка
bun run lint           # Проверка типов TypeScript + ESLint
bun run format         # Автоформатирование кода (Biome)
bun run db:push        # Применить схему Prisma к БД (без миграций)
bun run db:migrate     # Создать и применить миграцию (dev)
bun run db:seed        # Заполнить БД начальными данными
bun run db:reset       # Сбросить БД и повторить seed
bun run db:studio      # Открыть Prisma Studio (GUI для БД)
```

---

## Лицензия

MIT © 2024–2025 arscars
