export interface VehicleWithDetails {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  year: number | null;
  status: string;
  photoUrl: string | null;
  rating: number | null;
  description?: string;
  horsePower?: number;
  acceleration?: string; // 0-100 km/h
  topSpeed?: number; // km/h
  vehicleClass: { id: number; name: string };
  transmission: { id: number; name: string };
  fuelType: { id: number; name: string };
  baseTariff: { id: string; name: string; pricePerMinCents: number; minChargeCents: number };
  lastState?: { lat: number; lon: number; fuelPercent: number | null; chargePercent: number | null } | null;
}

// Unique photos per model from Unsplash (public domain car photos)
const modelPhotos: Record<string, string> = {
  "911 Carrera": "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&q=80&auto=format&fit=crop",
  "911 GT3": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  "911 Carrera S": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop",
  "911 GT3 RS": "https://images.unsplash.com/photo-1580274455191-1c62238fa1c9?w=800&q=80&auto=format&fit=crop",
  "Cayenne": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop",
  "Cayenne Turbo": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop",
  "Panamera": "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop",
  "Taycan": "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80&auto=format&fit=crop",
  "Taycan Turbo S": "https://images.unsplash.com/photo-1617814065893-9ba5d70e5b2b?w=800&q=80&auto=format&fit=crop",
  "Macan": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80&auto=format&fit=crop",
};

const modelDescriptions: Record<string, string> = {
  "911 Carrera": "Легендарный спорткар с воздушно-оппозитным мотором. Идеальный баланс между ежедневной практичностью и гоночными ощущениями.",
  "911 GT3": "Гоночный ДНК на дорогах общего пользования. Атмосферный двигатель 4.0 л, задний привод и механика — чистый драйверский экстаз.",
  "911 Carrera S": "Carrera S добавляет мощности и уверенности. Расширенные крылья, большие тормоза и обострённые ощущения при каждом разгоне.",
  "911 GT3 RS": "Предел возможного на публичных дорогах. Аэродинамика уровня GT-гонок, активная подвеска и 525 л.с. чистого адреналина.",
  "Cayenne": "Спортивный SUV, который не делает компромиссов. Динамика спорткара в кузове внедорожника с просторным салоном.",
  "Cayenne Turbo": "Турбо-мощь и полный привод. Разгон до 100 за 3.9 с, но при этом — комфорт премиум-класса для всей семьи.",
  "Panamera": "Гранд-туризмо четырёх дверей. Просторный салон, роскошь и спортивная динамика в одном неповторимом облике.",
  "Taycan": "Будущее началось уже сейчас. Полностью электрический суперкар Porsche с мгновенным крутящим моментом и запасом хода 450 км.",
  "Taycan Turbo S": "Вершина электрической эволюции. 761 л.с., разгон до 100 за 2.8 с и роскошный салон — превосходство без компромиссов.",
  "Macan": "Компактный спортивный SUV с ярким характером. Манёвренный, стремительный и элегантный — идеален для городских приключений.",
};

const modelSpecs: Record<string, { hp: number; accel: string; top: number }> = {
  "911 Carrera":    { hp: 385,  accel: "4.2",  top: 293 },
  "911 GT3":        { hp: 510,  accel: "3.4",  top: 318 },
  "911 Carrera S":  { hp: 450,  accel: "3.7",  top: 308 },
  "911 GT3 RS":     { hp: 525,  accel: "3.2",  top: 296 },
  "Cayenne":        { hp: 340,  accel: "5.9",  top: 243 },
  "Cayenne Turbo":  { hp: 550,  accel: "3.9",  top: 286 },
  "Panamera":       { hp: 330,  accel: "5.3",  top: 260 },
  "Taycan":         { hp: 408,  accel: "5.4",  top: 225 },
  "Taycan Turbo S": { hp: 761,  accel: "2.8",  top: 260 },
  "Macan":          { hp: 265,  accel: "6.2",  top: 232 },
};

export const vehicleClasses = [
  { id: 1, name: "sport" },
  { id: 2, name: "luxury" },
  { id: 3, name: "suv" },
  { id: 4, name: "coupe" },
  { id: 5, name: "sedan" },
];

export const transmissions = [
  { id: 1, name: "AT" },
  { id: 2, name: "MT" },
  { id: 3, name: "PDK" },
];

export const fuelTypes = [
  { id: 1, name: "petrol" },
  { id: 2, name: "diesel" },
  { id: 3, name: "electric" },
  { id: 4, name: "hybrid" },
];

const tariffs = [
  { id: "t1", name: "Стандарт",  pricePerMinCents: 1500,  minChargeCents: 30000 },
  { id: "t2", name: "Премиум",   pricePerMinCents: 2500,  minChargeCents: 50000 },
  { id: "t3", name: "Спорт",     pricePerMinCents: 4000,  minChargeCents: 80000 },
  { id: "t4", name: "Эксклюзив", pricePerMinCents: 6000,  minChargeCents: 120000 },
];

// Fixed data to avoid hydration mismatch
const vehicleData = [
  { model: "911 Carrera",    classId: 1, transmissionId: 3, fuelTypeId: 1, tariffIndex: 2, year: 2023, rating: 4.8, plate: "А123ВС 77", lat: 55.758, lon: 37.621, fuel: 85 },
  { model: "911 GT3",        classId: 1, transmissionId: 3, fuelTypeId: 1, tariffIndex: 3, year: 2024, rating: 4.9, plate: "В456КМ 77", lat: 55.752, lon: 37.615, fuel: 72 },
  { model: "Cayenne",        classId: 3, transmissionId: 1, fuelTypeId: 1, tariffIndex: 1, year: 2023, rating: 4.6, plate: "Е789НО 77", lat: 55.765, lon: 37.635, fuel: 60 },
  { model: "Panamera",       classId: 5, transmissionId: 3, fuelTypeId: 4, tariffIndex: 2, year: 2023, rating: 4.7, plate: "К012РС 77", lat: 55.748, lon: 37.608, fuel: 78, charge: 82 },
  { model: "Taycan",         classId: 5, transmissionId: 1, fuelTypeId: 3, tariffIndex: 2, year: 2024, rating: 4.9, plate: "М345ТУ 77", lat: 55.772, lon: 37.642, fuel: null, charge: 95 },
  { model: "Macan",          classId: 3, transmissionId: 3, fuelTypeId: 1, tariffIndex: 1, year: 2023, rating: 4.5, plate: "Х678АВ 77", lat: 55.745, lon: 37.598, fuel: 55 },
  { model: "911 Carrera S",  classId: 1, transmissionId: 3, fuelTypeId: 1, tariffIndex: 2, year: 2024, rating: 4.7, plate: "С901ЕК 77", lat: 55.780, lon: 37.655, fuel: 90 },
  { model: "Cayenne Turbo",  classId: 3, transmissionId: 1, fuelTypeId: 4, tariffIndex: 1, year: 2024, rating: 4.8, plate: "Н234МО 77", lat: 55.738, lon: 37.585, fuel: 65, charge: 70 },
  { model: "Taycan Turbo S", classId: 2, transmissionId: 1, fuelTypeId: 3, tariffIndex: 3, year: 2024, rating: 5.0, plate: "Р567ТХ 77", lat: 55.762, lon: 37.628, fuel: null, charge: 88 },
  { model: "911 GT3 RS",     classId: 1, transmissionId: 3, fuelTypeId: 1, tariffIndex: 3, year: 2023, rating: 4.9, plate: "У890АС 77", lat: 55.755, lon: 37.612, fuel: 80 },
  { model: "Panamera",       classId: 5, transmissionId: 3, fuelTypeId: 4, tariffIndex: 2, year: 2024, rating: 4.6, plate: "О123КЕ 77", lat: 55.770, lon: 37.648, fuel: 70, charge: 75 },
  { model: "Macan",          classId: 3, transmissionId: 3, fuelTypeId: 1, tariffIndex: 1, year: 2024, rating: 4.4, plate: "В456НМ 77", lat: 55.742, lon: 37.595, fuel: 45 },
];

export const mockVehicles: VehicleWithDetails[] = vehicleData.map((v, i) => {
  const specs = modelSpecs[v.model];
  return {
    id: `v${i + 1}`,
    brand: "Porsche",
    model: v.model,
    plateNumber: v.plate,
    year: v.year,
    status: "available",
    photoUrl: modelPhotos[v.model] || modelPhotos["911 Carrera"],
    rating: v.rating,
    description: modelDescriptions[v.model],
    horsePower: specs?.hp,
    acceleration: specs?.accel,
    topSpeed: specs?.top,
    vehicleClass: vehicleClasses.find((c) => c.id === v.classId)!,
    transmission: transmissions.find((t) => t.id === v.transmissionId)!,
    fuelType: fuelTypes.find((f) => f.id === v.fuelTypeId)!,
    baseTariff: tariffs[v.tariffIndex],
    lastState: {
      lat: v.lat,
      lon: v.lon,
      fuelPercent: v.fuel,
      chargePercent: (v as any).charge ?? null,
    },
  };
});

export function filterVehicles(vehicles: VehicleWithDetails[], filters: {
  classIds?: number[];
  transmissionIds?: number[];
  fuelTypeIds?: number[];
  minPrice?: number;
  maxPrice?: number;
}) {
  return vehicles.filter((v) => {
    if (filters.classIds?.length && !filters.classIds.includes(v.vehicleClass.id)) return false;
    if (filters.transmissionIds?.length && !filters.transmissionIds.includes(v.transmission.id)) return false;
    if (filters.fuelTypeIds?.length && !filters.fuelTypeIds.includes(v.fuelType.id)) return false;
    if (filters.minPrice && v.baseTariff.pricePerMinCents < filters.minPrice) return false;
    if (filters.maxPrice && v.baseTariff.pricePerMinCents > filters.maxPrice) return false;
    return true;
  });
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
