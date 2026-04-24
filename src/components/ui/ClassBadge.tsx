import { GlassBadge } from "./glass/GlassBadge";

type CarClass = "Эконом" | "Комфорт" | "Бизнес" | "Премиум" | "Элит";

const classVariants: Record<CarClass, "success" | "lavender" | "warning" | "neutral" | "danger"> = {
  "Эконом":  "success",
  "Комфорт": "lavender",
  "Бизнес":  "warning",
  "Премиум": "neutral",
  "Элит":    "danger",
};

export function deriveClass(pricePerMin: number): CarClass {
  if (pricePerMin < 7)  return "Эконом";
  if (pricePerMin < 12) return "Комфорт";
  if (pricePerMin < 20) return "Бизнес";
  if (pricePerMin < 35) return "Премиум";
  return "Элит";
}

export function ClassBadge({ className }: { className: string }) {
  const variant = classVariants[className as CarClass] ?? "neutral";
  return <GlassBadge variant={variant}>{className}</GlassBadge>;
}
