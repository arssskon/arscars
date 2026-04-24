"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Wallet,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Star,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  type: "card" | "sbp";
  cardNumber?: string;
  cardBrand?: string;
  expiryDate?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  type: "preauth" | "capture" | "refund" | "adjustment";
  status: "succeeded" | "failed" | "processing" | "canceled";
  amountCents: number;
  description: string;
  createdAt: Date;
  tripId?: string;
}

const mockPaymentMethods: PaymentMethod[] = [
  { id: "pm-1", type: "card", cardNumber: "4276 •••• •••• 1234", cardBrand: "Visa", expiryDate: "12/26", isDefault: true },
  { id: "pm-2", type: "card", cardNumber: "5469 •••• •••• 5678", cardBrand: "Mastercard", expiryDate: "08/25", isDefault: false },
];

const mockTransactions: Transaction[] = [
  { id: "tx-1", type: "capture", status: "succeeded", amountCents: 6750, description: "Поездка: BMW 5 Series", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), tripId: "trip-1" },
  { id: "tx-2", type: "capture", status: "succeeded", amountCents: 18000, description: "Поездка: Mercedes S-Class", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), tripId: "trip-2" },
  { id: "tx-3", type: "refund", status: "succeeded", amountCents: 2000, description: "Возврат: Технические неполадки", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: "tx-4", type: "capture", status: "succeeded", amountCents: 12500, description: "Поездка: Toyota Camry", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), tripId: "trip-3" },
  { id: "tx-5", type: "preauth", status: "canceled", amountCents: 5000, description: "Бронирование отменено", createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  succeeded: { label: "Успешно", color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { label: "Ошибка", color: "bg-red-100 text-red-700", icon: XCircle },
  processing: { label: "В обработке", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  canceled: { label: "Отменено", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const typeLabels: Record<string, string> = {
  preauth: "Холдирование",
  capture: "Списание",
  refund: "Возврат",
  adjustment: "Корректировка",
};

export default function PaymentsPage() {
  const { isAuthenticated } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
          <p className="text-muted-foreground mb-6">Чтобы управлять платежами</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login"><Button variant="outline">Войти</Button></Link>
            <Link href="/register"><Button className="lavender-gradient text-white">Регистрация</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = transactions
    .filter(t => t.type === "capture" && t.status === "succeeded")
    .reduce((acc, t) => acc + t.amountCents, 0);

  const totalRefunded = transactions
    .filter(t => t.type === "refund" && t.status === "succeeded")
    .reduce((acc, t) => acc + t.amountCents, 0);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/profile">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад в профиль
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Платежи</h1>
            <p className="text-muted-foreground">
              Управляйте способами оплаты и просматривайте историю транзакций
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Всего потрачено</p>
                    <p className="text-xl font-bold">{(totalSpent / 100).toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Возвраты</p>
                    <p className="text-xl font-bold text-green-600">{(totalRefunded / 100).toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Транзакций</p>
                    <p className="text-xl font-bold">{transactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="methods" className="space-y-6">
            <TabsList>
              <TabsTrigger value="methods" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Способы оплаты
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                История
              </TabsTrigger>
            </TabsList>

            <TabsContent value="methods" className="space-y-4">
              {/* Payment Methods */}
              <div className="grid gap-4">
                {paymentMethods.map((pm) => (
                  <Card key={pm.id} className={cn(
                    "transition-all",
                    pm.isDefault && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-20 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                            pm.cardBrand === "Visa" ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-red-500 to-orange-500"
                          )}>
                            {pm.cardBrand}
                          </div>
                          <div>
                            <p className="font-semibold">{pm.cardNumber}</p>
                            <p className="text-sm text-muted-foreground">Действует до {pm.expiryDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pm.isDefault ? (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              <Star className="h-3 w-3 mr-1 fill-primary" />
                              Основная
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(pm.id)}
                            >
                              Сделать основной
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setShowDeleteConfirm(pm.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Card Button */}
              <Card
                className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setShowAddCard(true)}
              >
                <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <Plus className="h-5 w-5" />
                  <span>Добавить карту</span>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Безопасность платежей</p>
                    <p className="text-muted-foreground">
                      Все платёжные данные защищены шифрованием. Мы не храним полные данные карт на наших серверах.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {transactions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Нет транзакций</h3>
                    <p className="text-muted-foreground">
                      Здесь будет история ваших платежей
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0 divide-y">
                    {transactions.map((tx) => {
                      const config = statusConfig[tx.status];
                      const isIncome = tx.type === "refund";

                      return (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              isIncome ? "bg-green-100" : "bg-primary/10"
                            )}>
                              {isIncome ? (
                                <ArrowDownLeft className="h-5 w-5 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{format(tx.createdAt, "d MMM yyyy, HH:mm", { locale: ru })}</span>
                                <span>•</span>
                                <span>{typeLabels[tx.type]}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-bold",
                              isIncome ? "text-green-600" : "text-foreground"
                            )}>
                              {isIncome ? "+" : "-"}{(tx.amountCents / 100).toLocaleString('ru-RU')} ₽
                            </p>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить карту</DialogTitle>
            <DialogDescription>
              Введите данные банковской карты
            </DialogDescription>
          </DialogHeader>
          <AddCardForm
            onSuccess={() => {
              setPaymentMethods(prev => [...prev, {
                id: `pm-${Date.now()}`,
                type: "card",
                cardNumber: "2202 •••• •••• 9999",
                cardBrand: "MIR",
                expiryDate: "12/27",
                isDefault: false
              }]);
              setShowAddCard(false);
            }}
            onCancel={() => setShowAddCard(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить карту?</DialogTitle>
            <DialogDescription>
              Карта будет удалена из вашего аккаунта. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AddCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCardForm({ onSuccess, onCancel }: AddCardFormProps) {
  const [form, setForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onSuccess();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Номер карты</Label>
        <Input
          id="cardNumber"
          placeholder="0000 0000 0000 0000"
          value={form.cardNumber}
          onChange={(e) => setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })}
          maxLength={19}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Срок действия</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: formatExpiry(e.target.value) })}
            maxLength={5}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="password"
            placeholder="•••"
            value={form.cvv}
            onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            maxLength={3}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardHolder">Имя держателя карты</Label>
        <Input
          id="cardHolder"
          placeholder="IVAN IVANOV"
          value={form.cardHolder}
          onChange={(e) => setForm({ ...form, cardHolder: e.target.value.toUpperCase() })}
          required
        />
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          type="submit"
          className="lavender-gradient text-white"
          disabled={loading}
        >
          {loading ? "Добавление..." : "Добавить карту"}
        </Button>
      </DialogFooter>
    </form>
  );
}
