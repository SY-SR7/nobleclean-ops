"use client";

import { Video, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { getToolMedia } from "@/lib/media-helper";

import { CleaningMediaModal } from "./cleaning-media-modal";
import { PriorityStatusBadge } from "./priority-status-badge";

type ToolStepCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> &
  Readonly<{
    actions?: ReactNode;
    completedControl?: ReactNode;
    dueLabel?: ReactNode;
    duration: ReactNode;
    isCompleted?: boolean;
    isDue?: boolean;
    isMandatory: boolean;
    mandatoryLabel: ReactNode;
    notes?: ReactNode;
    optionalLabel: ReactNode;
    recurrence: ReactNode;
    sequenceOrder: number;
    title: ReactNode;
    toolName?: string;
  }>;

export function ToolStepCard({
  actions,
  className,
  completedControl,
  dueLabel,
  duration,
  isCompleted = false,
  isDue = false,
  isMandatory,
  mandatoryLabel,
  notes,
  optionalLabel,
  recurrence,
  sequenceOrder,
  title,
  toolName,
  ...props
}: ToolStepCardProps) {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const media = getToolMedia(toolName || (typeof title === "string" ? title : ""));

  return (
    <>
      <article
        className={cn(
          "bg-surface-container-lowest shadow-level-1 grid gap-3 rounded-lg border p-4 transition",
          isCompleted ? "border-status-success" : "border-outline-variant",
          className,
        )}
        {...props}
      >
        <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-start">
          <div className="bg-surface-container text-primary-container inline-grid size-9 shrink-0 place-items-center rounded text-sm font-bold">
            {sequenceOrder}
          </div>

          {/* Tool Image Thumbnail (No humans) */}
          <button
            className="group relative h-14 w-20 shrink-0 overflow-hidden rounded border border-outline-variant bg-surface-container-low"
            onClick={() => setShowMediaModal(true)}
            title="Video-Demonstration ansehen"
            type="button"
          >
            <Image
              alt={String(title)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              height={80}
              src={media.imageUrl}
              width={120}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
              <Video className="size-4 text-white drop-shadow" />
            </div>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-on-surface text-base font-semibold">
                {title}
              </h4>
              <button
                className="inline-flex items-center gap-1 rounded bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary hover:bg-secondary/20 transition-colors"
                onClick={() => setShowMediaModal(true)}
                type="button"
              >
                <Video className="size-3" />
                Video Demo
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriorityStatusBadge
                label={isMandatory ? mandatoryLabel : optionalLabel}
                tone={isMandatory ? "critical" : "neutral"}
              />
              {isMandatory && isDue && !isCompleted && dueLabel ? (
                <PriorityStatusBadge label={dueLabel} tone="critical" />
              ) : null}
              <span className="text-on-surface-variant text-sm">{duration}</span>
              <span className="text-on-surface-variant text-sm">
                {recurrence}
              </span>
            </div>
          </div>
          {completedControl || actions ? (
            <div className="flex flex-wrap justify-end gap-2">
              {completedControl}
              {actions}
            </div>
          ) : null}
        </div>
        {notes ? (
          <div className="bg-surface-container-low text-on-surface-variant rounded p-3 text-sm">
            {notes}
          </div>
        ) : null}
      </article>

      <CleaningMediaModal
        imageUrl={media.imageUrl}
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        title={String(title)}
        videoTitle={media.videoTitle}
        videoSteps={media.steps}
      />
    </>
  );
}
