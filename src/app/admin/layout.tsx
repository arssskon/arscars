"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { ToastProvider } from "@/components/admin/Toast";
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Route,
  Users,
  FileText,
  CreditCard,
  MapPin,
  AlertTriangle,
  ClipboardList,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Дашборд", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Автомобили", href: "/admin/vehicles", icon: Car },
  { label: "Бронирования", href: "/admin/reservations", icon: CalendarCheck },
  { label: "Поездки", href: "/admin/trips", icon: Route },
  { label: "Пользователи", href: "/admin/users", icon: Users },
  { label: "Документы", href: "/admin/documents", icon: FileText },
  { label: "Тарифы", href: "/admin/tariffs", icon: CreditCard },
  { label: "Зоны", href: "/admin/zones", icon: MapPin },
  { label: "Инциденты", href: "/admin/incidents", icon: AlertTriangle },
  { label: "Аудит", href: "/admin/audit", icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to hydrate from localStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !user?.roles.includes("admin")) {
      router.replace("/login?redirect=/admin");
    }
  }, [hydrated, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.replace("/login");
  };

  if (!hydrated || !isAuthenticated || !user?.roles.includes("admin")) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white text-lg">Проверка доступа...</div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-white">
            <span className="text-violet-400">ars</span>cars
          </span>
          <p className="text-xs text-slate-400 leading-none mt-0.5">Панель управления</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-800 px-3 py-4 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          На сайт
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-900">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-3 top-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header (desktop + mobile) */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Page title (mobile) / Admin badge (desktop) */}
            <span className="font-semibold text-slate-800 lg:hidden">
              {navItems.find(
                (item) =>
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
              )?.label ?? "Панель управления"}
            </span>
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-violet-50 border border-violet-200 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                Административный режим
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 leading-none">Администратор</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.fullName}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
