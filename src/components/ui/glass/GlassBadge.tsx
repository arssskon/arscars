import { cn } from "@/lib/utils";

type Variant = "lavender" | "success" | "warning" | "danger" | "neutral";

const variantStyles: Record<Variant, string> = {
  lavender: "bg-lavender-100/80 text-lavender-800 border-lavender-300/50",
  success:  "bg-green-100/80   text-green-800   border-green-300/50",
  warning:  "bg-amber-100/80   text-amber-800   border-amber-300/50",
  danger:   "bg-red-100/80     text-red-800     border-red-300/50",
  neutral:  "bg-white/60       text-gray-700    border-gray-200/60",
};

export function GlassBadge({
  children,
  variant = "lavender",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
