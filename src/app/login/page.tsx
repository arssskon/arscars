"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { Car, Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><div className="h-14 w-14 rounded-2xl lavender-gradient flex items-center justify-center"><Car className="h-7 w-7 text-white" /></div></div>
          <CardTitle className="text-2xl">Добро пожаловать в arscars</CardTitle>
          <CardDescription>Войдите, чтобы найти автомобиль любого класса</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 rounded-lg bg-muted">
              <Button type="button" variant={type === "email" ? "secondary" : "ghost"} className={cn("flex-1", type === "email" && "bg-background shadow-sm")} onClick={() => setType("email")}><Mail className="h-4 w-4 mr-2" />Email</Button>
              <Button type="button" variant={type === "phone" ? "secondary" : "ghost"} className={cn("flex-1", type === "phone" && "bg-background shadow-sm")} onClick={() => setType("phone")}><Phone className="h-4 w-4 mr-2" />Телефон</Button>
            </div>
            {type === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="email" type="email" placeholder="ivan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required /></div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between"><Label htmlFor="password">Пароль</Label><Link href="#" className="text-sm text-primary hover:underline">Забыли?</Link></div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type={showPwd ? "text" : "password"} placeholder="Введите пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
            </div>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full h-12 lavender-gradient text-white" disabled={loading}>{loading ? "Вход..." : "Войти"}</Button>
            <p className="text-center text-sm text-muted-foreground">Нет аккаунта? <Link href="/register" className="text-primary hover:underline font-medium">Зарегистрироваться</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
