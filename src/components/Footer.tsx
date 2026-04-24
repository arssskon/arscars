"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t py-8" style={{ backgroundColor: "#0F1C2E" }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg lavender-gradient">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                <span className="text-blue-400">ars</span>cars
              </span>
            </Link>
            <p className="text-xs text-blue-200/60">Каршеринг для всех классов и бюджетов</p>
          </div>
          <div className="flex gap-6 text-sm text-blue-200/70">
            <Link href="/about" className="hover:text-white transition-colors">О нас</Link>
            <Link href="/support" className="hover:text-white transition-colors">Поддержка</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Условия</Link>
          </div>
          <p className="text-sm text-blue-200/50">© 2026 arscars</p>
        </div>
      </div>
    </footer>
  );
}
