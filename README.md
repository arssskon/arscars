# arscars - Каршеринг Porsche

Премиальный сервис каршеринга автомобилей Porsche в Москве.

![arscars](https://images-porsche.imgix.net/-/media/1DBDC37E82084CF496EE48FCCE48BE0A_B3C2A87AF66E4046A12F32259A2BA221_911-gt3-side?w=1200&q=45&auto=format)

## Технологический стек

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT-based auth
- **Maps**: Яндекс.Карты (готово к интеграции)

## Быстрый старт

### Требования

- Node.js 18+ или Bun
- PostgreSQL 15+ (опционально для MVP)

### Установка

```bash
# Клонирование и установка зависимостей
cd arscars
bun install

# Запуск в режиме разработки
bun dev
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Database (для production)
DATABASE_URL="postgresql://user:password@localhost:5432/arscars?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Yandex Maps (опционально)
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="3c34dc81-b06e-4a4b-b07b-12d9405bf147"
```

### Работа с базой данных

```bash
# Генерация Prisma Client
bunx prisma generate

# Применение миграций
bunx prisma migrate dev

# Заполнение тестовыми данными
bunx prisma db seed
```

## Структура проекта

```
arscars/
├── prisma/
│   └── schema.prisma      # Схема базы данных
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Главная страница
│   │   ├── search/        # Поиск авто
│   │   ├── vehicles/      # Детали автомобиля
│   │   ├── login/         # Авторизация
│   │   ├── register/      # Регистрация
│   │   ├── trips/         # История поездок
│   │   └── profile/       # Профиль пользователя
│   ├── components/        # React компоненты
│   │   ├── ui/            # shadcn/ui компоненты
│   │   ├── Header.tsx
│   │   ├── VehicleCard.tsx
│   │   ├── VehicleMap.tsx
│   │   └── SearchFilters.tsx
│   └── lib/               # Утилиты и хелперы
│       ├── mock-data.ts   # Тестовые данные
│       ├── store.ts       # Zustand stores
│       └── utils.ts       # Утилиты
└── public/                # Статические файлы
```

## Функционал

### Для водителей (клиентов)
- Регистрация и авторизация (email/телефон)
- Поиск автомобилей на карте и в списке
- Фильтрация по классу, типу топлива, КПП, цене
- Просмотр деталей автомобиля
- Бронирование на 15 минут
- История поездок и платежей

### Для операторов (в разработке)
- Управление бронированиями
- Просмотр активных поездок
- Обработка инцидентов

### Для администраторов (в разработке)
- Управление автопарком
- Настройка тарифов и зон
- Верификация пользователей

## База данных

Полная схема базы данных находится в `prisma/schema.prisma` и включает:

- **users** — пользователи
- **roles** — роли (driver, support, admin)
- **driver_profiles** — профили водителей
- **driver_documents** — документы (паспорт, права)
- **vehicles** — автомобили Porsche
- **vehicle_classes** — классы (sport, luxury, suv)
- **tariffs** — тарифы
- **zones** — геозоны
- **reservations** — бронирования
- **trips** — поездки
- **payments** — платежи
- **incidents** — инциденты

## API Endpoints

```
POST /api/auth/register    # Регистрация
POST /api/auth/login       # Авторизация
GET  /api/vehicles         # Список автомобилей
GET  /api/vehicles/:id     # Детали автомобиля
POST /api/reservations     # Создание брони
GET  /api/reservations     # Мои бронирования
POST /api/trips/start      # Начало поездки
POST /api/trips/finish     # Завершение поездки
```

## Особенности

- **Лавандовый дизайн**: Основной цвет #B57EDC
- **Только Porsche**: Премиальный автопарк
- **Российская локализация**: RUB, русский язык
- **Адаптивность**: Desktop-first с мобильной версией

## Лицензия

MIT
