"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassButton } from "@/components/ui/glass";
import { useAuthStore } from "@/lib/store";
import { Menu, Search, User, LogOut, History } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Поиск", href: "/search", icon: Search },
  { name: "Мои поездки", href: "/trips", icon: History },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(240, 236, 248, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(181, 126, 220, 0.15)",
        boxShadow: "0 2px 20px rgba(124, 58, 237, 0.06)",
      }}
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="arscars" width={400} height={112} priority className="h-24 w-auto object-contain" />
        </Link>

        {/* Desktop nav pills */}
        <div className="hidden md:flex md:items-center">
          <div className="glass-light rounded-full px-2 py-1.5 flex items-center gap-1">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                      isActive
                        ? "bg-lavender-400 text-white"
                        : "text-lavender-900/70 hover:text-lavender-900 hover:bg-white/40"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-lavender-400/50">
                  <Avatar className="h-9 w-9 border-2 border-lavender-400/30">
                    <AvatarFallback className="bg-lavender-100 text-lavender-700 text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-0 rounded-2xl">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-lavender-100 text-lavender-700 text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{user.fullName}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{user.email || user.phone}</span>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-lavender-200/30" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="text-[var(--text-primary)]">
                    <User className="mr-2 h-4 w-4 text-lavender-400" />Профиль
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/trips" className="text-[var(--text-primary)]">
                    <History className="mr-2 h-4 w-4 text-lavender-400" />Мои поездки
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-lavender-200/30" />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
                  }}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <GlassButton variant="outline" size="sm">Войти</GlassButton>
              </Link>
              <Link href="/register">
                <GlassButton variant="primary" size="sm">Регистрация</GlassButton>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 rounded-full glass text-lavender-700">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 glass border-0">
              <div className="flex flex-col gap-4 pt-4">
                <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                  <Image src="/logo.png" alt="arscars" width={320} height={92} className="h-20 w-auto object-contain" />
                </Link>
                <div className="flex flex-col gap-1 pt-4">
                  {nav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
                        <div
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isActive
                              ? "bg-lavender-400 text-white"
                              : "text-lavender-900/70 hover:text-lavender-900 hover:bg-white/40"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-lavender-200/30">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <GlassButton variant="outline" className="w-full">Войти</GlassButton>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <GlassButton variant="primary" className="w-full">Регистрация</GlassButton>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
