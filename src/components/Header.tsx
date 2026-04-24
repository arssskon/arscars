"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store";
import { Menu, Search, Car, User, LogOut, History } from "lucide-react";
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

  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[#E9D8F7] bg-background/95 backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg lavender-gradient">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span style={{ color: "#B57EDC" }}>ars</span>cars
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex md:items-center md:gap-1">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2 relative",
                    isActive
                      ? "bg-[#F5EFFE] text-[#7C3AED] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-[#B57EDC]"
                      : "text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#F5EFFE]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-[#B57EDC]/30">
                    <AvatarFallback className="bg-[#F5EFFE] text-[#7C3AED] text-sm font-medium">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#F5EFFE] text-[#7C3AED] text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">{user.email || user.phone}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="mr-2 h-4 w-4" />Профиль</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/trips"><History className="mr-2 h-4 w-4" />Мои поездки</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { logout(); document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"; }}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-[#7C3AED] hover:bg-[#F5EFFE] hover:text-[#4C1D95]">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button className="lavender-gradient text-white hover:opacity-90">Регистрация</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-[#7C3AED]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-l-2 border-[#E9D8F7]">
              <div className="flex flex-col gap-4 pt-4">
                <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg lavender-gradient">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold">
                    <span style={{ color: "#B57EDC" }}>ars</span>cars
                  </span>
                </Link>
                <div className="flex flex-col gap-1 pt-4">
                  {nav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-2",
                            isActive
                              ? "bg-[#F5EFFE] text-[#7C3AED] font-semibold border-l-2 border-[#B57EDC]"
                              : "text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#F5EFFE]"
                          )}
                        >
                          <item.icon className="h-4 w-4" />{item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
                {!isAuthenticated && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-[#E9D8F7]">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full text-[#7C3AED] border-[#B57EDC]/40 hover:bg-[#F5EFFE]">
                        Войти
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full lavender-gradient text-white">Регистрация</Button>
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
