"use client";

import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function GlassButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: GlassButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender-400/50 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-lavender-400 text-white shadow-lg shadow-lavender-400/30 hover:bg-lavender-600 hover:shadow-lavender-600/40 hover:-translate-y-0.5 active:translate-y-0",
    ghost:
      "glass text-lavender-900 hover:bg-white/70 hover:-translate-y-0.5",
    outline:
      "border-2 border-lavender-400 text-lavender-700 bg-white/20 backdrop-blur-sm hover:bg-lavender-400 hover:text-white hover:-translate-y-0.5",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
