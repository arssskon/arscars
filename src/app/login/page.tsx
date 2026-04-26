"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [type, setType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "email" ? { email, password } : { phone, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Неверный email или пароль");
        return;
      }
      setUser(data.user, data.token);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || (data.user.roles.includes("admin") ? "/admin" : "/");
      router.push(redirect);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <GlassPanel floating className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="arscars" width={160} height={46} className="h-11 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Добро пожаловать
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Войдите, чтобы найти автомобиль любого класса
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-2 p-1 rounded-xl glass-light">
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                type === "email" ? "bg-white shadow-sm text-lavender-700" : "text-gray-500 hover:text-lavender-600"
              )}
              onClick={() => setType("email")}
            >
              <Mail className="h-4 w-4" />Email
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                type === "phone" ? "bg-white shadow-sm text-lavender-700" : "text-gray-500 hover:text-lavender-600"
              )}
              onClick={() => setType("phone")}
            >
              <Phone className="h-4 w-4" />Телефон
            </button>
          </div>

          {type === "email" ? (
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "var(--text-primary)" }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
                <Input
                  id="email" type="email" placeholder="ivan@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/50 backdrop-blur border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone" style={{ color: "var(--text-primary)" }}>Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
                <Input
                  id="phone" type="tel" placeholder="+7 (999) 123-45-67"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-white/50 backdrop-blur border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password" style={{ color: "var(--text-primary)" }}>Пароль</Label>
              <Link href="#" className="text-sm text-lavender-600 hover:underline">Забыли?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                id="password" type={showPwd ? "text" : "password"}
                placeholder="Введите пароль"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/50 backdrop-blur border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lavender-400"
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full rounded-2xl"
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </GlassButton>

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Нет аккаунта?{" "}
            <Link href="/register" className="text-lavender-600 hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </GlassPanel>
    </div>
  );
}
