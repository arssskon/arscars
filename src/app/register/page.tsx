"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { Car, Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Check } from "lucide-react";

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

  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><div className="h-14 w-14 rounded-2xl lavender-gradient flex items-center justify-center"><Car className="h-7 w-7 text-white" /></div></div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для аренды Porsche</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>ФИО</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="fullName" placeholder="Иван Петров" value={form.fullName} onChange={ch} className="pl-10" required /></div></div>
            <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="email" type="email" placeholder="ivan@example.com" value={form.email} onChange={ch} className="pl-10" required /></div></div>
            <div className="space-y-2"><Label>Телефон</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="phone" type="tel" placeholder="+7 (999) 123-45-67" value={form.phone} onChange={ch} className="pl-10" /></div></div>
            <div className="space-y-2"><Label>Дата рождения</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="birthDate" type="date" value={form.birthDate} onChange={ch} className="pl-10" required /></div></div>
            <div className="space-y-2"><Label>Пароль</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="password" type={showPwd ? "text" : "password"} placeholder="Минимум 8 символов" value={form.password} onChange={ch} className="pl-10 pr-10" minLength={8} required /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div className="space-y-2"><Label>Подтвердите пароль</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input name="confirm" type={showPwd ? "text" : "password"} placeholder="Повторите пароль" value={form.confirm} onChange={ch} className="pl-10" required /></div></div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setTerms(!terms)} className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${terms ? "bg-primary border-primary" : "border-muted-foreground/50"}`}>{terms && <Check className="h-3 w-3 text-white" />}</div>
              <span className="text-sm text-muted-foreground">Я принимаю <Link href="#" className="text-primary hover:underline">условия</Link></span>
            </label>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full h-12 lavender-gradient text-white" disabled={loading}>{loading ? "Регистрация..." : "Создать аккаунт"}</Button>
            <p className="text-center text-sm text-muted-foreground">Уже есть аккаунт? <Link href="/login" className="text-primary hover:underline font-medium">Войти</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
