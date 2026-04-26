"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer
      style={{
        background: "rgba(76, 29, 149, 0.90)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(181, 126, 220, 0.25)",
      }}
      className="py-10"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="arscars"
                width={380}
                height={108}
                className="h-24 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-xs text-lavender-200">Каршеринг для всех классов и бюджетов</p>
          </div>

          {/* Nav links */}
          <div className="flex gap-6 text-sm">
            <Link href="/about"   className="text-lavender-300 hover:text-white transition-colors">О нас</Link>
            <Link href="/support" className="text-lavender-300 hover:text-white transition-colors">Поддержка</Link>
            <Link href="/terms"   className="text-lavender-300 hover:text-white transition-colors">Условия</Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-lavender-400/70">© 2026 arscars</p>
        </div>
      </div>
    </footer>
  );
}
