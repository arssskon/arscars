"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Необходима авторизация</h1>
        <Link href="/login"><Button className="lavender-gradient text-white">Войти</Button></Link>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        credentials: "include",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/profile">
            <Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Назад в профиль</Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Безопасность</h1>

          {/* Смена пароля */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Смена пароля</CardTitle>
              <CardDescription>Используйте надёжный пароль длиной не менее 6 символов</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">Пароль успешно изменён</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Текущий пароль</Label>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        value={form.currentPassword}
                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Новый пароль</Label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Подтвердите новый пароль</Label>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={saving} className="w-full lavender-gradient text-white">
                    {saving ? "Сохранение..." : "Изменить пароль"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Выход */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><LogOut className="h-5 w-5" />Выход из аккаунта</CardTitle>
              <CardDescription>Вы будете перенаправлены на главную страницу</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout} className="w-full">Выйти из аккаунта</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
