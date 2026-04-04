"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store";
import { User, Mail, Phone, MapPin, Calendar, Shield, FileText, CreditCard, CheckCircle, AlertCircle, Clock, ChevronRight, Save, PartyPopper } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const verificationStatus: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  draft:    { label: "Не подтверждён", color: "bg-muted text-muted-foreground",  icon: AlertCircle },
  pending:  { label: "На проверке",    color: "bg-yellow-500 text-white",         icon: Clock },
  approved: { label: "Подтверждён",    color: "bg-green-500 text-white",          icon: CheckCircle },
  rejected: { label: "Отклонён",       color: "bg-red-500 text-white",            icon: AlertCircle },
};

interface ProfileData {
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  verificationStatus: string;
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const { user, isAuthenticated, token, setUser } = useAuthStore();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", birthDate: "" });

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/me/profile", { credentials: "include", headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setProfile(data);
          setForm({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Необходима авторизация</h1>
        <Link href="/login"><Button className="lavender-gradient text-white">Войти</Button></Link>
      </div>
    );
  }

  const initials = (profile?.fullName || user.fullName).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const verInfo = verificationStatus[profile?.verificationStatus ?? "draft"];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => p ? { ...p, ...data } : data);
        setUser({ ...user, fullName: data.fullName, email: data.email, phone: data.phone });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.fullName || user.fullName;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {isWelcome && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full lavender-gradient flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Добро пожаловать!</h3>
                <p className="text-muted-foreground">Загрузите документы для верификации</p>
              </div>
              <Link href="/documents"><Button className="lavender-gradient text-white">Загрузить</Button></Link>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground text-sm">{profile?.email || profile?.phone || user.email || user.phone}</p>
              <div className="mt-4">
                {verInfo && (
                  <Badge className={verInfo.color}>
                    <verInfo.icon className="h-3 w-3 mr-1" />{verInfo.label}
                  </Badge>
                )}
              </div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Link href="/documents" className="block">
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4" />Документы</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/payments" className="block">
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Оплата</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" />Безопасность</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Main form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Личные данные</CardTitle>
                  <CardDescription>Контактная информация</CardDescription>
                </div>
                {!editing
                  ? <Button variant="outline" onClick={() => setEditing(true)}>Редактировать</Button>
                  : (
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>
                      <Button onClick={handleSave} disabled={saving} className="lavender-gradient text-white">
                        <Save className="h-4 w-4 mr-2" />{saving ? "..." : "Сохранить"}
                      </Button>
                    </div>
                  )
                }
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ФИО</Label>
                  {editing
                    ? <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pl-10" /></div>
                    : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><User className="h-5 w-5 text-muted-foreground" />{displayName}</p>
                  }
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  {editing
                    ? <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" /></div>
                    : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Mail className="h-5 w-5 text-muted-foreground" />{profile?.email || "Не указан"}</p>
                  }
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  {editing
                    ? <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-10" /></div>
                    : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Phone className="h-5 w-5 text-muted-foreground" />{profile?.phone || "Не указан"}</p>
                  }
                </div>
                <div className="space-y-2">
                  <Label>Дата рождения</Label>
                  {editing
                    ? <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="pl-10" /></div>
                    : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Calendar className="h-5 w-5 text-muted-foreground" />{profile?.birthDate ? format(new Date(profile.birthDate), "d MMMM yyyy", { locale: ru }) : "Не указана"}</p>
                  }
                </div>
              </div>
              <div className="space-y-2">
                <Label>Адрес</Label>
                {editing
                  ? <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="pl-10" placeholder="Город, улица, дом" /></div>
                  : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><MapPin className="h-5 w-5 text-muted-foreground" />{profile?.address || "Не указан"}</p>
                }
              </div>
            </CardContent>
          </Card>

          {/* Verification block */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Статус верификации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-2"><FileText className="h-5 w-5 text-primary" /><span className="font-medium">Паспорт</span></div>
                  <Badge variant="outline" className="text-muted-foreground">Смотрите в Документах</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-2"><FileText className="h-5 w-5 text-primary" /><span className="font-medium">Водительское удостоверение</span></div>
                  <Badge variant="outline" className="text-muted-foreground">Смотрите в Документах</Badge>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-2"><Shield className="h-5 w-5 text-primary" /><span className="font-medium">Общий статус</span></div>
                  {verInfo && <Badge className={verInfo.color}><verInfo.icon className="h-3 w-3 mr-1" />{verInfo.label}</Badge>}
                </div>
              </div>
              <Link href="/documents">
                <Button className="lavender-gradient text-white">Управление документами</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}
