"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "blue" | "orange" | "red" | "gray" | "purple";

const variantClasses: Record<BadgeVariant, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  purple: "bg-violet-100 text-violet-800 border-violet-200",
};

// Vehicle statuses
const vehicleStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  available: { label: "Доступен", variant: "green" },
  reserved: { label: "Забронирован", variant: "yellow" },
  in_trip: { label: "В поездке", variant: "blue" },
  service: { label: "Сервис", variant: "orange" },
  blocked: { label: "Заблокирован", variant: "red" },
};

// Reservation statuses
const reservationStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Активна", variant: "green" },
  canceled: { label: "Отменена", variant: "red" },
  expired: { label: "Истекла", variant: "gray" },
  converted: { label: "Конвертирована", variant: "blue" },
};

// Trip statuses
const tripStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Активна", variant: "blue" },
  finished: { label: "Завершена", variant: "green" },
  forced_finished: { label: "Принудительно завершена", variant: "orange" },
  canceled: { label: "Отменена", variant: "red" },
};

// User statuses
const userStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Активен", variant: "green" },
  blocked: { label: "Заблокирован", variant: "red" },
  deleted: { label: "Удален", variant: "gray" },
};

// Incident types
const incidentTypeMap: Record<string, { label: string; variant: BadgeVariant }> = {
  damage: { label: "Повреждение", variant: "orange" },
  accident: { label: "ДТП", variant: "red" },
  fine: { label: "Штраф", variant: "yellow" },
  evacuation: { label: "Эвакуация", variant: "purple" },
  other: { label: "Другое", variant: "gray" },
};

// Incident statuses
const incidentStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  new: { label: "Новый", variant: "yellow" },
  in_progress: { label: "В работе", variant: "blue" },
  closed: { label: "Закрыт", variant: "green" },
};

export type StatusType = "vehicle" | "reservation" | "trip" | "user" | "incidentType" | "incidentStatus" | "tariff";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let label = status;
  let variant: BadgeVariant = "gray";

  switch (type) {
    case "vehicle":
      if (vehicleStatusMap[status]) {
        label = vehicleStatusMap[status].label;
        variant = vehicleStatusMap[status].variant;
      }
      break;
    case "reservation":
      if (reservationStatusMap[status]) {
        label = reservationStatusMap[status].label;
        variant = reservationStatusMap[status].variant;
      }
      break;
    case "trip":
      if (tripStatusMap[status]) {
        label = tripStatusMap[status].label;
        variant = tripStatusMap[status].variant;
      }
      break;
    case "user":
      if (userStatusMap[status]) {
        label = userStatusMap[status].label;
        variant = userStatusMap[status].variant;
      }
      break;
    case "incidentType":
      if (incidentTypeMap[status]) {
        label = incidentTypeMap[status].label;
        variant = incidentTypeMap[status].variant;
      }
      break;
    case "incidentStatus":
      if (incidentStatusMap[status]) {
        label = incidentStatusMap[status].label;
        variant = incidentStatusMap[status].variant;
      }
      break;
    case "tariff":
      variant = status === "true" || status === "active" ? "green" : "gray";
      label = variant === "green" ? "Активен" : "Неактивен";
      break;
    default:
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
