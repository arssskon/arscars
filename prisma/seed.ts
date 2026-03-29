import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // Роли
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: "driver" }, update: {}, create: { name: "driver" } }),
    prisma.role.upsert({ where: { name: "support" }, update: {}, create: { name: "support" } }),
    prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin" } }),
  ]);
  const [driverRole, supportRole, adminRole] = roles;
  console.log("✅ Роли:", roles.length);

  // Классы авто
  const vehicleClasses = await Promise.all([
    prisma.vehicleClass.upsert({ where: { name: "sport" }, update: {}, create: { name: "sport" } }),
    prisma.vehicleClass.upsert({ where: { name: "luxury" }, update: {}, create: { name: "luxury" } }),
    prisma.vehicleClass.upsert({ where: { name: "suv" }, update: {}, create: { name: "suv" } }),
    prisma.vehicleClass.upsert({ where: { name: "coupe" }, update: {}, create: { name: "coupe" } }),
    prisma.vehicleClass.upsert({ where: { name: "sedan" }, update: {}, create: { name: "sedan" } }),
  ]);
  console.log("✅ Классы авто:", vehicleClasses.length);

  // Трансмиссии
  const transmissions = await Promise.all([
    prisma.transmission.upsert({ where: { name: "AT" }, update: {}, create: { name: "AT" } }),
    prisma.transmission.upsert({ where: { name: "MT" }, update: {}, create: { name: "MT" } }),
    prisma.transmission.upsert({ where: { name: "PDK" }, update: {}, create: { name: "PDK" } }),
  ]);
  console.log("✅ Трансмиссии:", transmissions.length);

  // Типы топлива
  const fuelTypes = await Promise.all([
    prisma.fuelType.upsert({ where: { name: "petrol" }, update: {}, create: { name: "petrol" } }),
    prisma.fuelType.upsert({ where: { name: "diesel" }, update: {}, create: { name: "diesel" } }),
    prisma.fuelType.upsert({ where: { name: "electric" }, update: {}, create: { name: "electric" } }),
    prisma.fuelType.upsert({ where: { name: "hybrid" }, update: {}, create: { name: "hybrid" } }),
  ]);
  console.log("✅ Типы топлива:", fuelTypes.length);

  // Тарифы
  const tariffs = await Promise.all([
    prisma.tariff.upsert({ where: { name: "Стандарт" }, update: {}, create: { name: "Стандарт", pricePerMinCents: 1500, minChargeCents: 30000, isActive: true } }),
    prisma.tariff.upsert({ where: { name: "Премиум" }, update: {}, create: { name: "Премиум", pricePerMinCents: 2500, minChargeCents: 50000, isActive: true } }),
    prisma.tariff.upsert({ where: { name: "Спорт" }, update: {}, create: { name: "Спорт", pricePerMinCents: 4000, minChargeCents: 80000, isActive: true } }),
    prisma.tariff.upsert({ where: { name: "Эксклюзив" }, update: {}, create: { name: "Эксклюзив", pricePerMinCents: 6000, minChargeCents: 120000, isActive: true } }),
  ]);
  console.log("✅ Тарифы:", tariffs.length);

  // Зоны
  const chelyabinskZone = await prisma.zone.upsert({
    where: { name: "Челябинск" },
    update: {},
    create: { name: "Челябинск", centerLat: 55.1644, centerLon: 61.4368, radiusM: 25000 },
  });
  await prisma.zoneRule.upsert({
    where: { zoneId: chelyabinskZone.id },
    update: {},
    create: { zoneId: chelyabinskZone.id, canFinish: true, outOfZoneFeeCents: 50000, note: "Штраф за завершение вне зоны — 500 ₽" },
  });

  const ekbZone = await prisma.zone.upsert({
    where: { name: "Екатеринбург" },
    update: {},
    create: { name: "Екатеринбург", centerLat: 56.8389, centerLon: 60.6057, radiusM: 25000 },
  });
  await prisma.zoneRule.upsert({
    where: { zoneId: ekbZone.id },
    update: {},
    create: { zoneId: ekbZone.id, canFinish: true, outOfZoneFeeCents: 50000, note: "Штраф за завершение вне зоны — 500 ₽" },
  });
  console.log("✅ Зоны: 2");

  // Автомобили
  const modelPhotos: Record<string, string> = {
    "911 Carrera":   "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80&auto=format&fit=crop",
    "911 GT3":       "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
    "911 Carrera S": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop",
    "911 GT3 RS":    "https://images.unsplash.com/photo-1580274455191-1c62238fa1c9?w=800&q=80&auto=format&fit=crop",
    "Cayenne":       "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop",
    "Cayenne Turbo": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop",
    "Panamera":      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop",
    "Taycan":        "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80&auto=format&fit=crop",
    "Taycan Turbo S":"https://images.unsplash.com/photo-1617814065893-9ba5d70e5b2b?w=800&q=80&auto=format&fit=crop",
    "Macan":         "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80&auto=format&fit=crop",
  };

  // Chelyabinsk: 55.1644, 61.4368 | Yekaterinburg: 56.8389, 60.6057
  const vehicleData = [
    // Челябинск (5 авто)
    { model: "911 Carrera",   classId: vehicleClasses[0].id, transId: transmissions[2].id, fuelId: fuelTypes[0].id, tariffId: tariffs[2].id, year: 2023, plate: "А123ВС 74", lat: 55.1596, lon: 61.4003, fuel: 85,   rating: 4.8, status: "available"  as const, zoneId: chelyabinskZone.id },
    { model: "Cayenne",       classId: vehicleClasses[2].id, transId: transmissions[0].id, fuelId: fuelTypes[0].id, tariffId: tariffs[0].id, year: 2023, plate: "Е789НО 74", lat: 55.1700, lon: 61.4480, fuel: 60,   rating: 4.6, status: "available"  as const, zoneId: chelyabinskZone.id },
    { model: "Macan",         classId: vehicleClasses[2].id, transId: transmissions[2].id, fuelId: fuelTypes[0].id, tariffId: tariffs[0].id, year: 2023, plate: "Х678АВ 74", lat: 55.1548, lon: 61.4195, fuel: 55,   rating: 4.5, status: "service"    as const, zoneId: chelyabinskZone.id },
    { model: "911 Carrera S", classId: vehicleClasses[0].id, transId: transmissions[2].id, fuelId: fuelTypes[0].id, tariffId: tariffs[2].id, year: 2024, plate: "С901ЕК 74", lat: 55.1680, lon: 61.3920, fuel: 90,   rating: 4.7, status: "available"  as const, zoneId: chelyabinskZone.id },
    { model: "Cayenne Turbo", classId: vehicleClasses[2].id, transId: transmissions[0].id, fuelId: fuelTypes[3].id, tariffId: tariffs[1].id, year: 2024, plate: "Н234МО 74", lat: 55.1610, lon: 61.4312, fuel: 65,   rating: 4.8, status: "available"  as const, charge: 70, zoneId: chelyabinskZone.id },
    // Екатеринбург (5 авто)
    { model: "911 GT3",       classId: vehicleClasses[0].id, transId: transmissions[2].id, fuelId: fuelTypes[0].id, tariffId: tariffs[3].id, year: 2024, plate: "В456КМ 66", lat: 56.8389, lon: 60.6057, fuel: 72,   rating: 4.9, status: "available"  as const, zoneId: ekbZone.id },
    { model: "Panamera",      classId: vehicleClasses[4].id, transId: transmissions[2].id, fuelId: fuelTypes[3].id, tariffId: tariffs[1].id, year: 2023, plate: "К012РС 66", lat: 56.8450, lon: 60.6210, fuel: 78,   rating: 4.7, status: "in_trip"    as const, charge: 82, zoneId: ekbZone.id },
    { model: "Taycan",        classId: vehicleClasses[4].id, transId: transmissions[0].id, fuelId: fuelTypes[2].id, tariffId: tariffs[1].id, year: 2024, plate: "М345ТУ 66", lat: 56.8310, lon: 60.5940, fuel: null, rating: 4.9, status: "available"  as const, charge: 95, zoneId: ekbZone.id },
    { model: "Taycan Turbo S",classId: vehicleClasses[1].id, transId: transmissions[0].id, fuelId: fuelTypes[2].id, tariffId: tariffs[3].id, year: 2024, plate: "Р567ТХ 66", lat: 56.8520, lon: 60.6380, fuel: null, rating: 5.0, status: "reserved"   as const, charge: 88, zoneId: ekbZone.id },
    { model: "911 GT3 RS",    classId: vehicleClasses[0].id, transId: transmissions[2].id, fuelId: fuelTypes[0].id, tariffId: tariffs[3].id, year: 2023, plate: "У890АС 66", lat: 56.8260, lon: 60.6090, fuel: 80,   rating: 4.9, status: "available"  as const, zoneId: ekbZone.id },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plate },
      update: { status: v.status },
      create: {
        brand: "Porsche",
        model: v.model,
        plateNumber: v.plate,
        year: v.year,
        classId: v.classId,
        transmissionId: v.transId,
        fuelTypeId: v.fuelId,
        baseTariffId: v.tariffId,
        defaultZoneId: v.zoneId,
        status: v.status,
        photoUrl: modelPhotos[v.model] ?? modelPhotos["911 Carrera"],
        rating: v.rating,
      },
    });
    await prisma.vehicleLastState.upsert({
      where: { vehicleId: vehicle.id },
      update: { lat: v.lat, lon: v.lon, fuelPercent: v.fuel, chargePercent: v.charge ?? null },
      create: { vehicleId: vehicle.id, lat: v.lat, lon: v.lon, fuelPercent: v.fuel, chargePercent: v.charge ?? null },
    });
    vehicles.push(vehicle);
  }
  console.log("✅ Автомобили:", vehicleData.length);

  const passwordHash = await bcrypt.hash("password123", 12);

  // Тестовый пользователь (driver)
  const testUser = await prisma.user.upsert({
    where: { email: "test@arscars.ru" },
    update: {},
    create: {
      email: "test@arscars.ru",
      phone: "+79991234567",
      passwordHash,
      fullName: "Иван Петров",
      birthDate: new Date("1990-01-15"),
      address: "Москва, ул. Тверская, 1",
      status: "active",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: testUser.id, roleId: driverRole.id } },
    update: {},
    create: { userId: testUser.id, roleId: driverRole.id },
  });
  await prisma.driverProfile.upsert({
    where: { userId: testUser.id },
    update: {},
    create: { userId: testUser.id, verification: "approved", verifiedAt: new Date() },
  });

  // Второй водитель
  const driver2 = await prisma.user.upsert({
    where: { email: "driver2@arscars.ru" },
    update: {},
    create: {
      email: "driver2@arscars.ru",
      phone: "+79998765432",
      passwordHash,
      fullName: "Мария Сидорова",
      birthDate: new Date("1995-06-20"),
      status: "active",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: driver2.id, roleId: driverRole.id } },
    update: {},
    create: { userId: driver2.id, roleId: driverRole.id },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    update: {},
    create: { userId: driver2.id, verification: "pending" },
  });

  // Заблокированный пользователь
  const blockedUser = await prisma.user.upsert({
    where: { email: "blocked@arscars.ru" },
    update: {},
    create: {
      email: "blocked@arscars.ru",
      passwordHash,
      fullName: "Заблокированный Пользователь",
      status: "blocked",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: blockedUser.id, roleId: driverRole.id } },
    update: {},
    create: { userId: blockedUser.id, roleId: driverRole.id },
  });

  // Support
  const supportUser = await prisma.user.upsert({
    where: { email: "support@arscars.ru" },
    update: {},
    create: {
      email: "support@arscars.ru",
      passwordHash,
      fullName: "Оператор Поддержки",
      status: "active",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: supportUser.id, roleId: supportRole.id } },
    update: {},
    create: { userId: supportUser.id, roleId: supportRole.id },
  });

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@arscars.ru" },
    update: {},
    create: {
      email: "admin@arscars.ru",
      passwordHash,
      fullName: "Администратор",
      status: "active",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log("✅ Пользователи: 5");

  // Завершённая поездка
  const finishedTrip = await prisma.trip.create({
    data: {
      userId: testUser.id,
      vehicleId: vehicles[0].id,
      tariffId: tariffs[2].id,
      status: "finished",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      durationMinutes: 45,
      amountCents: 180000,
      startLat: 55.758,
      startLon: 37.621,
      endLat: 55.741,
      endLon: 37.610,
    },
  });

  // Активная поездка
  const activeTrip = await prisma.trip.create({
    data: {
      userId: driver2.id,
      vehicleId: vehicles[3].id, // Panamera (in_trip)
      tariffId: tariffs[1].id,
      status: "active",
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      startLat: 55.748,
      startLon: 37.608,
    },
  });

  // Ещё одна завершённая поездка
  await prisma.trip.create({
    data: {
      userId: driver2.id,
      vehicleId: vehicles[2].id,
      tariffId: tariffs[0].id,
      status: "finished",
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      durationMinutes: 60,
      amountCents: 90000,
      startLat: 55.765,
      startLon: 37.635,
      endLat: 55.750,
      endLon: 37.620,
    },
  });

  console.log("✅ Поездки: 3");

  // Бронирование
  const reservation = await prisma.reservation.create({
    data: {
      code: "RSV-001",
      userId: testUser.id,
      vehicleId: vehicles[8].id, // Taycan Turbo S (reserved)
      status: "active",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Истёкшее бронирование
  await prisma.reservation.create({
    data: {
      code: "RSV-002",
      userId: driver2.id,
      vehicleId: vehicles[4].id,
      status: "expired",
      expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Бронирования: 2");

  // Платёж за завершённую поездку
  await prisma.payment.create({
    data: {
      tripId: finishedTrip.id,
      userId: testUser.id,
      type: "capture",
      status: "succeeded",
      amountCents: 180000,
      providerName: "mock",
      providerRef: "PAY-001",
    },
  });

  console.log("✅ Платежи: 1");

  // Инцидент
  await prisma.incident.create({
    data: {
      type: "damage",
      status: "new",
      userId: testUser.id,
      vehicleId: vehicles[9].id, // GT3 RS (blocked)
      tripId: finishedTrip.id,
      description: "Царапина на правом крыле при парковке",
    },
  });

  await prisma.incident.create({
    data: {
      type: "fine",
      status: "in_progress",
      userId: driver2.id,
      vehicleId: vehicles[2].id,
      description: "Штраф за нарушение ПДД",
      assignedTo: supportUser.id,
    },
  });

  console.log("✅ Инциденты: 2");

  // Записи в статусной истории
  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: vehicles[9].id,
      prevStatus: "available",
      nextStatus: "blocked",
      reason: "Повреждение после ДТП",
      actorUserId: adminUser.id,
    },
  });

  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: vehicles[5].id,
      prevStatus: "available",
      nextStatus: "service",
      reason: "Плановое ТО",
      actorUserId: adminUser.id,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: "vehicle.status_change",
      entityType: "vehicle",
      entityId: vehicles[9].id,
      meta: { prevStatus: "available", nextStatus: "blocked", reason: "Повреждение после ДТП" },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: "vehicle.status_change",
      entityType: "vehicle",
      entityId: vehicles[5].id,
      meta: { prevStatus: "available", nextStatus: "service", reason: "Плановое ТО" },
    },
  });

  console.log("✅ История и аудит");

  console.log("\n🎉 База данных успешно заполнена!\n");
  console.log("📧 Тестовые учётные записи:");
  console.log("   Водитель:      test@arscars.ru   / password123");
  console.log("   Водитель 2:    driver2@arscars.ru / password123");
  console.log("   Поддержка:     support@arscars.ru / password123");
  console.log("   Администратор: admin@arscars.ru   / password123");
  console.log("\n🔗 Админ-панель: http://localhost:3000/admin");
}

main()
  .catch((e) => { console.error("❌ Ошибка:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
