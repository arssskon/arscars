"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  floating?: boolean;
}

export function GlassPanel({ title, children, className, floating = false }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "glass rounded-3xl p-5",
        floating && "shadow-2xl shadow-lavender-600/15",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="font-semibold text-[var(--text-primary)] text-base">{title}</h3>
          <div className="w-8 h-0.5 bg-lavender-400 rounded-full mt-1" />
        </div>
      )}
      {children}
    </motion.div>
  );
}
