"use client";

import { Play, X, CheckCircle, Video } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "./button";

type CleaningMediaModalProps = Readonly<{
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoTitle: string;
  videoSteps?: readonly string[];
}>;

export function CleaningMediaModal({
  imageUrl,
  isOpen,
  onClose,
  title,
  videoTitle,
  videoSteps = [],
}: CleaningMediaModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface-container-lowest border-outline-variant relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-outline-variant bg-surface-container-low flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Video className="text-secondary size-5" />
            <h3 className="font-heading text-on-surface text-base font-bold truncate">
              {title}
            </h3>
          </div>
          <button
            aria-label="Schließen"
            className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Video Player Display Area */}
        <div className="bg-black relative aspect-video w-full overflow-hidden">
          {isPlaying ? (
            <div className="relative flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              {/* Simulated Motion Graphic (No humans) */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="border-secondary/40 absolute inset-0 animate-ping rounded-full border-2" />
                <div className="border-secondary absolute inset-2 animate-spin rounded-full border-2 border-t-transparent" />
                <Image
                  alt={title}
                  className="rounded-full object-cover opacity-80"
                  height={80}
                  src={imageUrl}
                  width={80}
                />
              </div>

              {/* Video Title Overlay */}
              <p className="mt-4 text-sm font-semibold text-white">
                {videoTitle}
              </p>

              {/* Video Progress Bar */}
              <div className="mt-6 w-full max-w-md">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full bg-secondary animate-pulse w-3/4 rounded-full" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-white/60">
                  <span>0:14</span>
                  <span>1:30</span>
                </div>
              </div>

              <Button
                className="mt-4"
                onClick={() => setIsPlaying(false)}
                size="sm"
                variant="secondary"
              >
                Video pausieren
              </Button>
            </div>
          ) : (
            <div className="group relative h-full w-full cursor-pointer" onClick={() => setIsPlaying(true)}>
              <Image
                alt={title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                height={500}
                priority
                src={imageUrl}
                width={900}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
                <div className="bg-secondary text-on-secondary shadow-level-2 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-1 size-7 fill-current" />
                </div>
                <span className="mt-3 rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  Demonstration Video abspielen (Ohne Personen)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Video Steps Checklist */}
        {videoSteps.length > 0 && (
          <div className="border-outline-variant bg-surface-container-lowest border-t p-4 sm:p-5">
            <h4 className="text-on-surface mb-3 text-xs font-bold uppercase tracking-wider">
              Anleitung & Schritte
            </h4>
            <div className="space-y-2">
              {videoSteps.map((step, idx) => (
                <div
                  key={step}
                  className="bg-surface-container-low flex items-start gap-3 rounded-lg p-2.5 text-sm"
                >
                  <span className="bg-secondary/15 text-secondary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-on-surface font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
