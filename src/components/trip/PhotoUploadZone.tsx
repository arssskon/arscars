"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2, CheckCircle2, Loader2, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export type PhotoAngle = "FRONT" | "REAR" | "LEFT" | "RIGHT" | "INTERIOR" | "OTHER";
export type TripPhase = "START" | "END";

export interface TripPhoto {
  id: string;
  tripId: string;
  phase: TripPhase;
  angle: PhotoAngle;
  url: string;
  note?: string | null;
  uploadedBy: string;
  createdAt: string;
}

const ANGLES: { value: PhotoAngle; label: string }[] = [
  { value: "FRONT",    label: "Перед" },
  { value: "REAR",     label: "Зад" },
  { value: "LEFT",     label: "Лево" },
  { value: "RIGHT",    label: "Право" },
  { value: "INTERIOR", label: "Салон" },
  { value: "OTHER",    label: "Другое" },
];

const REQUIRED_ANGLES: PhotoAngle[] = ["FRONT", "REAR", "LEFT", "RIGHT"];

interface Props {
  phase: TripPhase;
  tripId: string;
  existingPhotos: TripPhoto[];
  onUploaded: (photo: TripPhoto) => void;
  onDeleted?: (photoId: string) => void;
  onError?: (msg: string) => void;
}

export function PhotoUploadZone({ phase, tripId, existingPhotos, onUploaded, onDeleted, onError }: Props) {
  const { token } = useAuthStore();
  const [uploading, setUploading] = useState<PhotoAngle | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<PhotoAngle | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingAngle = useRef<PhotoAngle | null>(null);

  const photosByAngle = existingPhotos.reduce<Partial<Record<PhotoAngle, TripPhoto>>>((acc, p) => {
    if (!acc[p.angle]) acc[p.angle] = p;
    return acc;
  }, {});

  const uploadedCount = Object.keys(photosByAngle).length;
  const requiredDone = REQUIRED_ANGLES.every((a) => !!photosByAngle[a]);

  const triggerUpload = (angle: PhotoAngle) => {
    if (photosByAngle[angle] || uploading) return;
    pendingAngle.current = angle;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const angle = pendingAngle.current;
    if (!file || !angle) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      onError?.("Только изображения (jpg, png, webp, heic)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError?.("Файл слишком большой (макс. 10 МБ)");
      return;
    }

    setUploading(angle);
    try {
      const fd = new FormData();
      fd.append("phase", phase);
      fd.append("angle", angle);
      fd.append("file", file);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/trips/${tripId}/photos`, {
        method: "POST",
        credentials: "include",
        headers,
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError?.(data.error ?? "Ошибка загрузки");
        return;
      }

      const photo: TripPhoto = await res.json();
      onUploaded(photo);
    } catch {
      onError?.("Ошибка сети при загрузке фото");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (photo: TripPhoto) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api/trips/${tripId}/photos?photoId=${photo.id}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    if (res.ok) onDeleted?.(photo.id);
  };

  const phaseTitle = phase === "START" ? "Фото при получении" : "Фото при возврате";

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(124,58,237,0.14)] border border-white/30">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#7C3AED] to-[#4C1D95]">
        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{phaseTitle}</p>
          <p className="text-white/70 text-xs">Зафиксируй состояние со всех сторон</p>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white/[.15] backdrop-blur-md p-4">
        <div className="grid grid-cols-3 gap-3">
          {ANGLES.map(({ value, label }) => {
            const photo = photosByAngle[value];
            const isLoading = uploading === value;
            const isRequired = REQUIRED_ANGLES.includes(value);

            return (
              <motion.div
                key={value}
                layoutId={`slot-${phase}-${value}`}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                onHoverStart={() => setHoveredSlot(value)}
                onHoverEnd={() => setHoveredSlot(null)}
                onClick={() => !photo && triggerUpload(value)}
              >
                {photo ? (
                  <>
                    {/* Filled slot */}
                    <img src={photo.url} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Green check */}
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" strokeWidth={2} />
                    </div>
                    {/* Delete on hover */}
                    <AnimatePresence>
                      {hoveredSlot === value && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center shadow"
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                        >
                          <Trash2 className="h-3 w-3 text-white" strokeWidth={2} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    {/* Angle label */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1.5 py-1 text-center">
                      <span className="text-white text-[10px] font-medium">{label}</span>
                    </div>
                  </>
                ) : isLoading ? (
                  /* Loading slot */
                  <div className="w-full h-full bg-[#7C3AED]/10 border-2 border-[#7C3AED]/30 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Loader2 className="h-5 w-5 text-[#7C3AED] animate-spin" strokeWidth={1.5} />
                    <span className="text-[10px] text-[#7C3AED]">Загрузка...</span>
                  </div>
                ) : (
                  /* Empty slot */
                  <motion.div
                    className="w-full h-full border-2 border-dashed border-[#7C3AED]/40 rounded-xl flex flex-col items-center justify-center gap-1"
                    animate={{ backgroundColor: hoveredSlot === value ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.02)" }}
                    transition={{ duration: 0.15 }}
                  >
                    <Plus className="h-5 w-5 text-[#7C3AED]/60" strokeWidth={1.5} />
                    <span className="text-[10px] text-[#7C3AED]/70 font-medium">{label}</span>
                    {isRequired && (
                      <span className="text-[9px] text-[#7C3AED]/50">обязательно</span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Status badge */}
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
            <Camera className="h-3 w-3" />
            {uploadedCount} из 6 загружено
          </span>
          {requiredDone && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100/80 text-green-700 border border-green-300/50">
              <CheckCircle2 className="h-3 w-3" />
              Обязательные загружены
            </span>
          )}
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
