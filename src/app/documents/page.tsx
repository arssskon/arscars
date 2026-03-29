"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  ArrowLeft,
  Shield,
  X,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  type: "passport" | "driver_license";
  status: "draft" | "pending" | "approved" | "rejected";
  series?: string;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  fileName?: string;
  note?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  draft: { label: "Не загружен", color: "bg-muted text-muted-foreground", icon: AlertCircle },
  pending: { label: "На проверке", color: "bg-yellow-500 text-white", icon: Clock },
  approved: { label: "Подтверждён", color: "bg-green-500 text-white", icon: CheckCircle },
  rejected: { label: "Отклонён", color: "bg-red-500 text-white", icon: AlertCircle },
};

const docTypes: Record<string, { title: string; description: string }> = {
  passport: { title: "Паспорт РФ", description: "Загрузите разворот с фото" },
  driver_license: { title: "Водительское удостоверение", description: "Загрузите обе стороны" },
};

export default function DocumentsPage() {
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([
    { id: "doc-1", type: "passport", status: "draft" },
    { id: "doc-2", type: "driver_license", status: "draft" },
  ]);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Войдите в аккаунт</h1>
          <p className="text-muted-foreground mb-6">Чтобы загрузить документы</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login"><Button variant="outline">Войти</Button></Link>
            <Link href="/register"><Button className="lavender-gradient text-white">Регистрация</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (docId: string, file: File) => {
    setUploading(true);

    // Simulating file upload
    await new Promise(r => setTimeout(r, 1500));

    setDocuments(prev => prev.map(doc =>
      doc.id === docId
        ? { ...doc, status: "pending" as const, fileName: file.name, fileUrl: URL.createObjectURL(file) }
        : doc
    ));

    setUploading(false);
  };

  const handleSubmitDoc = async (docId: string, data: Partial<Document>) => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 1000));

    setDocuments(prev => prev.map(doc =>
      doc.id === docId
        ? { ...doc, ...data, status: "pending" as const }
        : doc
    ));

    setEditingDoc(null);
    setUploading(false);
  };

  const allApproved = documents.every(d => d.status === "approved");
  const hasPending = documents.some(d => d.status === "pending");

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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Документы</h1>
            <p className="text-muted-foreground">
              Загрузите документы для верификации аккаунта и начала поездок
            </p>
          </div>

          {/* Status Banner */}
          {allApproved ? (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">Верификация пройдена</p>
                  <p className="text-sm text-green-700">Все документы подтверждены</p>
                </div>
              </CardContent>
            </Card>
          ) : hasPending ? (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">Документы на проверке</p>
                  <p className="text-sm text-yellow-700">Обычно проверка занимает до 24 часов</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full lavender-gradient flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Загрузите документы</p>
                  <p className="text-sm text-muted-foreground">Для начала аренды необходимо пройти верификацию</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          <div className="space-y-4">
            {documents.map((doc) => {
              const config = statusConfig[doc.status];
              const typeConfig = docTypes[doc.type];
              const isEditing = editingDoc === doc.id;

              return (
                <Card key={doc.id} className={cn(
                  "overflow-hidden transition-all",
                  isEditing && "ring-2 ring-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          doc.status === "approved" ? "bg-green-100" : "bg-primary/10"
                        )}>
                          <FileText className={cn(
                            "h-5 w-5",
                            doc.status === "approved" ? "text-green-600" : "text-primary"
                          )} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{typeConfig.title}</CardTitle>
                          <CardDescription>{typeConfig.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={config.color}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {isEditing ? (
                      <DocumentForm
                        doc={doc}
                        onSubmit={(data) => handleSubmitDoc(doc.id, data)}
                        onCancel={() => setEditingDoc(null)}
                        uploading={uploading}
                      />
                    ) : doc.status === "draft" ? (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Нажмите, чтобы загрузить документ
                        </p>
                        <Button
                          onClick={() => setEditingDoc(doc.id)}
                          className="lavender-gradient text-white"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Загрузить
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {doc.fileName && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-sm font-medium">{doc.fileName}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {(doc.series || doc.number) && (
                          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                            {doc.series && (
                              <div>
                                <p className="text-xs text-muted-foreground">Серия</p>
                                <p className="font-medium">{doc.series}</p>
                              </div>
                            )}
                            {doc.number && (
                              <div>
                                <p className="text-xs text-muted-foreground">Номер</p>
                                <p className="font-medium">{doc.number}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {doc.status === "rejected" && doc.note && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">
                              <strong>Причина отклонения:</strong> {doc.note}
                            </p>
                            <Button
                              onClick={() => setEditingDoc(doc.id)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Загрузить заново
                            </Button>
                          </div>
                        )}

                        {doc.status === "pending" && (
                          <p className="text-sm text-muted-foreground">
                            Документ отправлен на проверку
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Требования к документам
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Фотография должна быть чёткой и читаемой
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Документ должен быть действующим
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Все данные должны быть видны полностью
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Формат файла: JPG, PNG или PDF
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface DocumentFormProps {
  doc: Document;
  onSubmit: (data: Partial<Document>) => void;
  onCancel: () => void;
  uploading: boolean;
}

function DocumentForm({ doc, onSubmit, onCancel, uploading }: DocumentFormProps) {
  const [form, setForm] = useState({
    series: doc.series || "",
    number: doc.number || "",
    issueDate: doc.issueDate || "",
    expiryDate: doc.expiryDate || "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      fileName: file?.name,
      fileUrl: file ? URL.createObjectURL(file) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload */}
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Нажмите или перетащите файл
              </p>
            </div>
          </label>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="series">Серия</Label>
          <Input
            id="series"
            placeholder={doc.type === "passport" ? "0000" : "00 00"}
            value={form.series}
            onChange={(e) => setForm({ ...form, series: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Номер</Label>
          <Input
            id="number"
            placeholder={doc.type === "passport" ? "000000" : "000000"}
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issueDate">Дата выдачи</Label>
          <Input
            id="issueDate"
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
          />
        </div>
        {doc.type === "driver_license" && (
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Срок действия</Label>
            <Input
              id="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          className="flex-1 lavender-gradient text-white"
          disabled={uploading || !file || !form.number}
        >
          {uploading ? "Загрузка..." : "Отправить на проверку"}
        </Button>
      </div>
    </form>
  );
}
