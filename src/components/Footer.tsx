"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg lavender-gradient">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">ars</span>cars
            </span>
          </Link>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">О нас</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Поддержка</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Условия</Link>
          </div>
          <p className="text-sm text-muted-foreground">2026 arscars</p>
        </div>
      </div>
    </footer>
  );
}
