"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="py-10 border-t border-[#7C3AED]" style={{ backgroundColor: "#4C1D95" }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg lavender-gradient">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                <span style={{ color: "#B57EDC" }}>ars</span>cars
              </span>
            </Link>
            <p className="text-xs" style={{ color: "#E9D8F7" }}>
              Каршеринг для всех классов и бюджетов
            </p>
          </div>

          {/* Nav links */}
          <div className="flex gap-6 text-sm" style={{ color: "#E9D8F7" }}>
            <Link href="/about"   className="hover:text-white transition-colors">О нас</Link>
            <Link href="/support" className="hover:text-white transition-colors">Поддержка</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">Условия</Link>
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "rgba(233,216,247,0.6)" }}>
            © 2026 arscars
          </p>
        </div>
      </div>
    </footer>
  );
}
