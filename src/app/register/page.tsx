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
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", birthDate: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terms, setTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
    if (!terms) { setError("Примите условия"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка регистрации"); return; }
      setUser(data.user, data.token);
      router.push("/profile?welcome=true");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const ch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const inputCls =
    "bg-white/50 backdrop-blur border-lavender-200 rounded-xl focus:ring-2 focus:ring-lavender-400/40 focus:border-lavender-400";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10">
      <GlassPanel floating className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="arscars" width={440} height={128} className="h-28 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Создать аккаунт
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Доступ к 500+ автомобилям за 2 минуты
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>ФИО</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="fullName" placeholder="Иван Петров"
                value={form.fullName} onChange={ch}
                className={`pl-10 ${inputCls}`} required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="email" type="email" placeholder="ivan@example.com"
                value={form.email} onChange={ch}
                className={`pl-10 ${inputCls}`} required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>Телефон</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="phone" type="tel" placeholder="+7 (999) 123-45-67"
                value={form.phone} onChange={ch}
                className={`pl-10 ${inputCls}`}
              />
            </div>
          </div>

          {/* Birth date */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>Дата рождения</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="birthDate" type="date"
                value={form.birthDate} onChange={ch}
                className={`pl-10 ${inputCls}`} required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="password" type={showPwd ? "text" : "password"}
                placeholder="Минимум 8 символов"
                value={form.password} onChange={ch}
                className={`pl-10 pr-10 ${inputCls}`} minLength={8} required
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

          {/* Confirm password */}
          <div className="space-y-2">
            <Label style={{ color: "var(--text-primary)" }}>Подтвердите пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-lavender-400" />
              <Input
                name="confirm" type={showPwd ? "text" : "password"}
                placeholder="Повторите пароль"
                value={form.confirm} onChange={ch}
                className={`pl-10 ${inputCls}`} required
              />
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setTerms(!terms)}
              className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                terms ? "bg-lavender-400 border-lavender-400" : "border-lavender-300/60"
              }`}
            >
              {terms && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Я принимаю{" "}
              <Link href="#" className="text-lavender-600 hover:underline">условия</Link>
            </span>
          </label>

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
            {loading ? "Регистрация..." : "Создать аккаунт"}
          </GlassButton>

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-lavender-600 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </form>
      </GlassPanel>
    </div>
  );
}
