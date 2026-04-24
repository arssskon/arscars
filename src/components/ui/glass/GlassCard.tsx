"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  dark?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, dark = false, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl p-6",
        dark ? "glass-dark" : "glass",
        hover && "glass-hover cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
