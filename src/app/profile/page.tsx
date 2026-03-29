"use client";

import { useState } from "react";
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

const verificationStatus: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  draft: { label: "Не подтверждён", color: "bg-muted text-muted-foreground", icon: AlertCircle },
  pending: { label: "На проверке", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Подтверждён", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Отклонён", color: "bg-red-500", icon: AlertCircle },
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName || "", email: user?.email || "", phone: user?.phone || "", address: "" });

  if (!isAuthenticated || !user) {
    return <div className="container mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold mb-4">Необходима авторизация</h1><Link href="/login"><Button className="lavender-gradient text-white">Войти</Button></Link></div>;
  }

  const initials = user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const verification = "draft";
  const verInfo = verificationStatus[verification];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setUser({ ...user, ...form });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {isWelcome && <Card className="mb-6 border-primary/20 bg-primary/5"><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-full lavender-gradient flex items-center justify-center"><PartyPopper className="h-6 w-6 text-white" /></div><div className="flex-1"><h3 className="font-bold text-lg">Добро пожаловать!</h3><p className="text-muted-foreground">Загрузите документы для верификации</p></div><Link href="/documents"><Button className="lavender-gradient text-white">Загрузить</Button></Link></CardContent></Card>}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20"><AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
              <h2 className="text-xl font-bold">{user.fullName}</h2>
              <p className="text-muted-foreground">{user.email || user.phone}</p>
              <div className="mt-4"><Badge className={verInfo.color}><verInfo.icon className="h-3 w-3 mr-1" />{verInfo.label}</Badge></div>
              <Separator className="my-6" />
              <div className="space-y-2">
                <Link href="/documents" className="block"><Button variant="ghost" className="w-full justify-between"><span className="flex items-center gap-2"><FileText className="h-4 w-4" />Документы</span><ChevronRight className="h-4 w-4" /></Button></Link>
                <Link href="/payments" className="block"><Button variant="ghost" className="w-full justify-between"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Оплата</span><ChevronRight className="h-4 w-4" /></Button></Link>
                <Link href="/settings" className="block"><Button variant="ghost" className="w-full justify-between"><span className="flex items-center gap-2"><Shield className="h-4 w-4" />Безопасность</span><ChevronRight className="h-4 w-4" /></Button></Link>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Личные данные</CardTitle><CardDescription>Контактная информация</CardDescription></div>
                {!editing ? <Button variant="outline" onClick={() => setEditing(true)}>Редактировать</Button> : <div className="flex gap-2"><Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={handleSave} disabled={saving} className="lavender-gradient text-white"><Save className="h-4 w-4 mr-2" />{saving ? "..." : "Сохранить"}</Button></div>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ФИО</Label>{editing ? <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="pl-10" /></div> : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><User className="h-5 w-5 text-muted-foreground" />{user.fullName}</p>}</div>
                <div className="space-y-2"><Label>Email</Label>{editing ? <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" /></div> : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Mail className="h-5 w-5 text-muted-foreground" />{user.email || "Не указан"}</p>}</div>
                <div className="space-y-2"><Label>Телефон</Label>{editing ? <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-10" /></div> : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Phone className="h-5 w-5 text-muted-foreground" />{user.phone || "Не указан"}</p>}</div>
                <div className="space-y-2"><Label>Дата рождения</Label><p className="flex items-center gap-2 p-2 rounded bg-muted/50"><Calendar className="h-5 w-5 text-muted-foreground" />Не указана</p></div>
              </div>
              <div className="space-y-2"><Label>Адрес</Label>{editing ? <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="pl-10" placeholder="Город, улица, дом" /></div> : <p className="flex items-center gap-2 p-2 rounded bg-muted/50"><MapPin className="h-5 w-5 text-muted-foreground" />Не указан</p>}</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-3">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Статус верификации</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border"><div className="flex items-center gap-3 mb-2"><FileText className="h-5 w-5 text-primary" /><span className="font-medium">Паспорт</span></div><Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Не загружен</Badge></div>
                <div className="p-4 rounded-lg border"><div className="flex items-center gap-3 mb-2"><FileText className="h-5 w-5 text-primary" /><span className="font-medium">Права</span></div><Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Не загружен</Badge></div>
                <div className="p-4 rounded-lg border bg-muted/30"><div className="flex items-center gap-3 mb-2"><Shield className="h-5 w-5 text-primary" /><span className="font-medium">Общий статус</span></div><Badge className={verInfo.color}><verInfo.icon className="h-3 w-3 mr-1" />{verInfo.label}</Badge></div>
              </div>
              <div className="mt-4"><Link href="/documents"><Button className="lavender-gradient text-white">Загрузить документы</Button></Link></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
