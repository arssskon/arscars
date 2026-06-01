"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2, CheckCircle2, Loader2, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import type { TripPhoto } from "./PhotoUploadZone";

type Angle = "FRONT" | "REAR" | "LEFT" | "RIGHT";

const SLOTS: { value: Angle; label: string }[] = [
  { value: "FRONT", label: "Перед" },
  { value: "REAR",  label: "Зад" },
  { value: "LEFT",  label: "Лево" },
  { value: "RIGHT", label: "Право" },
];

interface Props {
  reservationId: string;
  photos: TripPhoto[];
  onPhotosChange: (photos: TripPhoto[]) => void;
}

export function StartPhotoUpload({ reservationId, photos, onPhotosChange }: Props) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState<Angle | null>(null);
  const [hovered, setHovered] = useState<Angle | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingAngle = useRef<Angle | null>(null);

  const byAngle = photos.reduce<Partial<Record<Angle, TripPhoto>>>((acc, p) => {
    acc[p.angle as Angle] = p;
    return acc;
  }, {});

  const count = Object.keys(byAngle).length;
  const allDone = count === 4;

  const triggerUpload = (angle: Angle) => {
    if (byAngle[angle] || uploading) return;
    pendingAngle.current = angle;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const angle = pendingAngle.current;
    if (!file || !angle) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploading(angle);
    try {
      const fd = new FormData();
      fd.append("angle", angle);
      fd.append("file", file);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/reservations/${reservationId}/photos`, {
        method: "POST",
        credentials: "include",
        headers,
        body: fd,
      });
      if (!res.ok) return;
      const photo: TripPhoto = await res.json();
      onPhotosChange([...photos.filter((p) => p.angle !== photo.angle), photo]);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (photo: TripPhoto) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`/api/reservations/${reservationId}/photos?photoId=${photo.id}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    onPhotosChange(photos.filter((p) => p.id !== photo.id));
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/30 shadow-[0_8px_40px_rgba(124,58,237,0.14)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#4C1D95]">
        <Camera className="h-5 w-5 text-white flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">Фото автомобиля перед поездкой</p>
          <p className="text-white/70 text-xs">Перед, зад, левый и правый бок — обязательно</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allDone ? "bg-green-400/30 text-green-100" : "bg-white/20 text-white"}`}>
          {count}/4
        </span>
      </div>

      {/* Slots */}
      <div className="bg-white/[.15] backdrop-blur-md p-3">
        <div className="grid grid-cols-4 gap-2">
          {SLOTS.map(({ value, label }) => {
            const photo = byAngle[value];
            const isLoading = uploading === value;

            return (
              <motion.div
                key={value}
                layoutId={`start-slot-${reservationId}-${value}`}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer select-none"
                onHoverStart={() => setHovered(value)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => !photo && triggerUpload(value)}
              >
                {photo ? (
                  <>
                    <img src={photo.url} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" strokeWidth={2} />
                    </div>
                    <AnimatePresence>
                      {hovered === value && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow"
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                        >
                          <Trash2 className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 py-0.5 text-center">
                      <span className="text-white text-[9px] font-medium">{label}</span>
                    </div>
                  </>
                ) : isLoading ? (
                  <div className="w-full h-full bg-[#7C3AED]/10 border-2 border-[#7C3AED]/30 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Loader2 className="h-4 w-4 text-[#7C3AED] animate-spin" strokeWidth={1.5} />
                  </div>
                ) : (
                  <motion.div
                    className="w-full h-full border-2 border-dashed border-[#7C3AED]/40 rounded-xl flex flex-col items-center justify-center gap-0.5"
                    animate={{ backgroundColor: hovered === value ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.02)" }}
                    transition={{ duration: 0.12 }}
                  >
                    <Plus className="h-4 w-4 text-[#7C3AED]/50" strokeWidth={1.5} />
                    <span className="text-[9px] text-[#7C3AED]/70 font-medium">{label}</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
