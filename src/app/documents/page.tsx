"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store";
import { FileText, Upload, CheckCircle, Clock, AlertCircle, Camera, ArrowLeft, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocRecord {
  id?: string;
  docType: "passport" | "driver_license";
  docSeries?: string;
  docNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: "draft" | "pending" | "approved" | "rejected";
  note?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  draft:    { label: "Не загружен",  color: "bg-muted text-muted-foreground",  icon: AlertCircle },
  pending:  { label: "На проверке", color: "bg-yellow-500 text-white",         icon: Clock },
  approved: { label: "Подтверждён", color: "bg-green-500 text-white",          icon: CheckCircle },
  rejected: { label: "Отклонён",    color: "bg-red-500 text-white",            icon: AlertCircle },
};

const docTypes: Record<string, { title: string; description: string }> = {
  passport:       { title: "Паспорт РФ",                    description: "Загрузите разворот с фото" },
  driver_license: { title: "Водительское удостоверение",    description: "Загрузите обе стороны" },
};

const TYPES: ("passport" | "driver_license")[] = ["passport", "driver_license"];

export default function DocumentsPage() {
  const { isAuthenticated, token } = useAuthStore();
  const [docs, setDocs] = useState<Record<string, DocRecord>>({
    passport:       { docType: "passport",       status: "draft" },
    driver_license: { docType: "driver_license", status: "draft" },
  });
  const [editingType, setEditingType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/me/documents", { credentials: "include", headers: authHeaders })
      .then((r) => r.json())
      .then((data: DocRecord[]) => {
        if (!Array.isArray(data)) return;
        setDocs((prev) => {
          const next = { ...prev };
          data.forEach((d) => { next[d.docType] = d; });
          return next;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = async (docType: string, form: Partial<DocRecord>, fileName: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/documents", {
        method: "POST",
        credentials: "include",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, docType, fileUrl: fileName }),
      });
      if (res.ok) {
        setDocs((prev) => ({ ...prev, [docType]: { ...prev[docType], ...form, docType: docType as any, status: "pending", fileUrl: fileName } }));
        setEditingType(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  const allApproved = TYPES.every((t) => docs[t]?.status === "approved");
  const hasPending  = TYPES.some((t) => docs[t]?.status === "pending");

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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Документы</h1>
            <p className="text-muted-foreground">Загрузите документы для верификации аккаунта</p>
          </div>

          {/* Status banner */}
          {allApproved ? (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-white" /></div>
                <div><p className="font-semibold text-green-800">Верификация пройдена</p><p className="text-sm text-green-700">Все документы подтверждены</p></div>
              </CardContent>
            </Card>
          ) : hasPending ? (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center"><Clock className="h-6 w-6 text-white" /></div>
                <div><p className="font-semibold text-yellow-800">Документы на проверке</p><p className="text-sm text-yellow-700">Обычно проверка занимает до 24 часов</p></div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full lavender-gradient flex items-center justify-center"><Shield className="h-6 w-6 text-white" /></div>
                <div><p className="font-semibold">Загрузите документы</p><p className="text-sm text-muted-foreground">Для начала аренды необходимо пройти верификацию</p></div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {TYPES.map((docType) => {
              const doc = docs[docType];
              const config = statusConfig[doc?.status ?? "draft"];
              const typeConfig = docTypes[docType];
              const isEditing = editingType === docType;

              return (
                <Card key={docType} className={cn("overflow-hidden transition-all", isEditing && "ring-2 ring-primary")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", doc?.status === "approved" ? "bg-green-100" : "bg-primary/10")}>
                          <FileText className={cn("h-5 w-5", doc?.status === "approved" ? "text-green-600" : "text-primary")} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{typeConfig.title}</CardTitle>
                          <CardDescription>{typeConfig.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={config.color}>
                        <config.icon className="h-3 w-3 mr-1" />{config.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {isEditing ? (
                      <DocForm
                        docType={docType}
                        doc={doc}
                        onSubmit={(form, fileName) => handleSubmit(docType, form, fileName)}
                        onCancel={() => setEditingType(null)}
                        submitting={submitting}
                      />
                    ) : (doc?.status === "draft" || !doc?.id) ? (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">Нажмите, чтобы загрузить документ</p>
                        <Button onClick={() => setEditingType(docType)} className="lavender-gradient text-white">
                          <Camera className="h-4 w-4 mr-2" />Загрузить
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {doc.fileUrl && (
                          (() => {
                            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.fileUrl!);
                            return isImage ? (
                              <div className="rounded-lg overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={doc.fileUrl} alt="Документ" className="w-full max-h-48 object-contain bg-muted/30" />
                              </div>
                            ) : (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium underline">Открыть PDF</span>
                              </a>
                            );
                          })()
                        )}
                        {(doc.docSeries || doc.docNumber) && (
                          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                            {doc.docSeries && <div><p className="text-xs text-muted-foreground">Серия</p><p className="font-medium">{doc.docSeries}</p></div>}
                            {doc.docNumber && <div><p className="text-xs text-muted-foreground">Номер</p><p className="font-medium">{doc.docNumber}</p></div>}
                          </div>
                        )}
                        {doc.status === "rejected" && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700"><strong>Причина отклонения:</strong> {doc.note || "Документ не принят"}</p>
                            <Button onClick={() => setEditingType(docType)} variant="outline" size="sm" className="mt-2">Загрузить заново</Button>
                          </div>
                        )}
                        {doc.status === "pending" && (
                          <p className="text-sm text-muted-foreground">Документ отправлен на проверку</p>
                        )}
                        {doc.status === "approved" && (
                          <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Документ подтверждён администратором</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" />Требования к документам</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Фотография должна быть чёткой и читаемой", "Документ должен быть действующим", "Все данные должны быть видны полностью", "Формат файла: JPG, PNG или PDF"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface DocFormProps {
  docType: string;
  doc: DocRecord;
  onSubmit: (form: Partial<DocRecord>, fileName: string) => void;
  onCancel: () => void;
  submitting: boolean;
}

function DocForm({ docType, doc, onSubmit, onCancel, submitting }: DocFormProps) {
  const { token } = useAuthStore();
  const [form, setForm] = useState({
    docSeries: doc.docSeries || "",
    docNumber: doc.docNumber || "",
    issueDate: doc.issueDate ? doc.issueDate.slice(0, 10) : "",
    expiryDate: doc.expiryDate ? doc.expiryDate.slice(0, 10) : "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = (f: File) => {
    setFile(f);
    setUploadError("");
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    let fileUrl = doc.fileUrl || "";

    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) { setUploadError(data.error || "Ошибка загрузки файла"); return; }
        fileUrl = data.url;
      } catch {
        setUploadError("Ошибка загрузки файла");
        return;
      } finally {
        setUploading(false);
      }
    }

    onSubmit(form, fileUrl);
  };

  const isPdf = file?.type === "application/pdf";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed rounded-lg overflow-hidden">
        {file ? (
          <div>
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Превью документа" className="w-full max-h-48 object-contain bg-muted/30" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} МБ{isPdf ? " · PDF" : ""}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <label className="cursor-pointer block p-8 text-center hover:bg-muted/20 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Нажмите или перетащите файл</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP или PDF · до 10 МБ</p>
            </div>
          </label>
        )}
      </div>

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Серия</Label>
          <Input placeholder={docType === "passport" ? "0000" : "00 00"} value={form.docSeries} onChange={(e) => setForm({ ...form, docSeries: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Номер *</Label>
          <Input placeholder="000000" value={form.docNumber} onChange={(e) => setForm({ ...form, docNumber: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Дата выдачи</Label>
          <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
        </div>
        {docType === "driver_license" && (
          <div className="space-y-2">
            <Label>Срок действия</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Отмена</Button>
        <Button
          type="submit"
          className="flex-1 lavender-gradient text-white"
          disabled={submitting || uploading || !form.docNumber}
        >
          {uploading ? "Загрузка файла..." : submitting ? "Отправка..." : "Отправить на проверку"}
        </Button>
      </div>
    </form>
  );
}
