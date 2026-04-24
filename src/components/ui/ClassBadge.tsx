type CarClass = "Эконом" | "Комфорт" | "Бизнес" | "Премиум" | "Элит";

const classColors: Record<CarClass, string> = {
  "Эконом":  "bg-green-100 text-green-800 border-green-300",
  "Комфорт": "bg-blue-100 text-blue-800 border-blue-300",
  "Бизнес":  "bg-amber-100 text-amber-800 border-amber-300",
  "Премиум": "bg-orange-100 text-orange-800 border-orange-300",
  "Элит":    "bg-red-100 text-red-800 border-red-300",
};

export function deriveClass(pricePerMin: number): CarClass {
  if (pricePerMin < 7) return "Эконом";
  if (pricePerMin < 12) return "Комфорт";
  if (pricePerMin < 20) return "Бизнес";
  if (pricePerMin < 35) return "Премиум";
  return "Элит";
}

export function ClassBadge({ className }: { className: string }) {
  const colors = classColors[className as CarClass] ?? "bg-gray-100 text-gray-800 border-gray-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
      {className}
    </span>
  );
}
