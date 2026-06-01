"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";

interface Props {
  tripId: string;
  alreadyClaimed?: boolean;
  damageNote?: string | null;
}

export function DamageClaimForm({ tripId, alreadyClaimed, damageNote }: Props) {
  const { token } = useAuthStore();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(alreadyClaimed ?? false);
  const [savedNote, setSavedNote] = useState(damageNote ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (note.trim().length < 10) {
      setError("Опишите повреждение подробнее (минимум 10 символов)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/trips/${tripId}/damage-claim`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ note: note.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Ошибка при отправке");
        return;
      }

      setSavedNote(note.trim());
      setClaimed(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (claimed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-green-300/50 shadow-[0_8px_40px_rgba(5,150,105,0.10)]"
      >
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#059669] to-[#047857]">
          <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={1.5} />
          <p className="font-semibold text-white text-sm">Претензия зарегистрирована</p>
        </div>
        <div className="bg-white/[.15] backdrop-blur-md px-5 py-4">
          <p className="text-sm text-gray-700">
            Служба поддержки свяжется в течение 24 часов.
          </p>
          {savedNote && (
            <p className="mt-2 text-sm text-gray-500 italic">«{savedNote}»</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-red-300/50 shadow-[0_8px_40px_rgba(220,38,38,0.10)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#DC2626] to-[#991B1B]">
        <AlertTriangle className="h-5 w-5 text-white" strokeWidth={1.5} />
        <div>
          <p className="font-semibold text-white text-sm">Подать претензию о повреждении</p>
          <p className="text-white/70 text-xs">Описание будет передано в службу поддержки</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white/[.15] backdrop-blur-md p-4 space-y-3">
        <textarea
          value={note}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
          placeholder="Опишите повреждения подробно: где именно, характер повреждения..."
          rows={4}
          className="w-full rounded-xl px-3 py-2 text-sm bg-white/60 border border-red-200 focus:border-red-400 focus:outline-none resize-none"
        />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-600 text-xs"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          variant="destructive"
          className="w-full gap-2"
          disabled={loading || note.trim().length < 10}
          onClick={handleSubmit}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {loading ? "Отправка..." : "Подать претензию"}
        </Button>
      </div>
    </div>
  );
}
