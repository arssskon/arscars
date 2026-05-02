"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { GlassBadge } from "@/components/ui/glass/GlassBadge";
import { GlassCard } from "@/components/ui/glass/GlassCard";
import { ClassBadge } from "@/components/ui/ClassBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/components/admin/Toast";
import { Plus, Car, Trash2, Pencil, Settings2 } from "lucide-react";

interface Listing {
  id: string; make: string; model: string; year: number;
  plateNumber: string; vehicleClass: string; status: string;
  pricePerMinute: number; address: string; photoUrls: string[];
  rejectReason: string | null; createdAt: string;
}

const statusLabel: Record<string, { text: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  PENDING:   { text: "На модерации",   variant: "warning" },
  APPROVED:  { text: "Опубликовано",   variant: "success" },
  REJECTED:  { text: "Отклонено",      variant: "danger" },
  SUSPENDED: { text: "Приостановлено", variant: "neutral" },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.replace("/login?redirect=/owner/dashboard");
    return null;
  }

  useEffect(() => {
    fetch("/api/owner/listings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setListings(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/owner/listings/${deleteTarget}`, { method: "DELETE", credentials: "include" });
      if (res.status === 204) {
        setListings((prev) => prev.filter((l) => l.id !== deleteTarget));
        success("Объявление удалено");
      } else {
        toastError("Ошибка удаления");
      }
    } catch {
      toastError("Ошибка сети");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4" style={{ background: "var(--page-bg)" }}>
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Мои объявления
          </h1>
          <Link href="/owner/new">
            <GlassButton variant="outline">
              <Plus className="h-4 w-4" /> Добавить автомобиль
            </GlassButton>
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="glass rounded-3xl py-20 flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-lavender-100/60 flex items-center justify-center">
              <Car className="h-12 w-12 text-lavender-400" />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                У вас пока нет объявлений
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Добавьте первый автомобиль и начните зарабатывать
              </p>
            </div>
            <Link href="/owner/new">
              <GlassButton variant="primary" size="lg">Добавить первый автомобиль</GlassButton>
            </Link>
          </div>
        )}

        {/* Listing cards */}
        {!loading && listings.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            <AnimatePresence>
              {listings.map((l) => {
                const st = statusLabel[l.status] ?? { text: l.status, variant: "neutral" as const };
                const canEdit = l.status === "PENDING" || l.status === "REJECTED";
                return (
                  <motion.div key={l.id} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.95 }}>
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-0">
                        {/* Photo */}
                        <div className="relative sm:w-48 sm:h-36 h-40 w-full flex-shrink-0 bg-lavender-50 overflow-hidden sm:rounded-l-2xl rounded-t-2xl sm:rounded-tr-none">
                          {l.photoUrls[0] ? (
                            <Image src={l.photoUrls[0]} alt={l.model} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Settings2 className="h-10 w-10 text-lavender-300" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-between p-4 flex-1 gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                                  {l.make} {l.model} {l.year}
                                </span>
                                <ClassBadge className={l.vehicleClass} />
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                {l.plateNumber}
                              </p>
                            </div>
                            <GlassBadge variant={st.variant}>{st.text}</GlassBadge>
                          </div>

                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {l.status === "APPROVED"
                              ? <span className="font-semibold text-lavender-600">{l.pricePerMinute} ₽/мин</span>
                              : l.address}
                          </div>

                          {l.status === "REJECTED" && l.rejectReason && (
                            <p className="text-xs text-red-500">{l.rejectReason}</p>
                          )}

                          <div className="flex gap-2 pt-1">
                            {canEdit && (
                              <Link href={`/owner/listings/${l.id}/edit`}>
                                <GlassButton variant="ghost" size="sm">
                                  <Pencil className="h-3.5 w-3.5" /> Редактировать
                                </GlassButton>
                              </Link>
                            )}
                            <GlassButton
                              variant="ghost" size="sm"
                              className="text-red-500 hover:bg-red-50/20"
                              onClick={() => setDeleteTarget(l.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Удалить
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить объявление?</DialogTitle>
            <DialogDescription>Это действие нельзя отменить.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <GlassButton variant="ghost" onClick={() => setDeleteTarget(null)}>Отмена</GlassButton>
            <GlassButton
              variant="primary"
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
