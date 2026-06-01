"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TripPhoto, TripPhase } from "./PhotoUploadZone";

const ANGLE_LABELS: Record<string, string> = {
  FRONT:    "Перед",
  REAR:     "Зад",
  LEFT:     "Лево",
  RIGHT:    "Право",
  INTERIOR: "Салон",
  OTHER:    "Другое",
};

interface Props {
  photos: TripPhoto[];
  phase: TripPhase;
  title?: string;
}

export function PhotoGalleryViewer({ photos, phase, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const phaseTitle = title ?? (phase === "START" ? "Фото при получении" : "Фото при возврате");
  const isEmpty = photos.length === 0;

  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(124,58,237,0.14)] border border-white/30">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#7C3AED] to-[#4C1D95]">
          <p className="font-semibold text-white text-sm">{phaseTitle}</p>
          {!isEmpty && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
              {photos.length} фото
            </span>
          )}
        </div>

        {/* Content */}
        <div className="bg-white/[.15] backdrop-blur-md p-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <ImageOff className="h-10 w-10 text-[#7C3AED]/30" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Фото ещё не загружены</p>
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {photos.map((photo, idx) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden cursor-pointer snap-start group"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img src={photo.url} alt={ANGLE_LABELS[photo.angle]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-6 w-6 text-white drop-shadow" strokeWidth={1.5} />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 px-2 py-1">
                    <span className="text-white text-[10px] font-medium">{ANGLE_LABELS[photo.angle]}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black/90 border-white/10 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentPhoto && (
              <motion.div
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="relative"
              >
                <img
                  src={currentPhoto.url}
                  alt={ANGLE_LABELS[currentPhoto.angle]}
                  className="w-full max-h-[70vh] object-contain"
                />
                {/* Controls overlay */}
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" strokeWidth={2} />
                </button>
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </button>
                  </>
                )}
                {/* Caption */}
                <div className="px-5 py-3 bg-black/60">
                  <p className="text-white text-sm font-medium">{ANGLE_LABELS[currentPhoto.angle]}</p>
                  {currentPhoto.note && (
                    <p className="text-white/60 text-xs mt-0.5">{currentPhoto.note}</p>
                  )}
                  <p className="text-white/40 text-xs mt-0.5">
                    {lightboxIndex !== null ? lightboxIndex + 1 : ""} / {photos.length}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
