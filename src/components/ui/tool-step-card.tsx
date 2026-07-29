import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { PriorityStatusBadge } from "./priority-status-badge";

type ToolStepCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> &
  Readonly<{
    actions?: ReactNode;
    completedControl?: ReactNode;
    duration: ReactNode;
    isCompleted?: boolean;
    isMandatory: boolean;
    mandatoryLabel: ReactNode;
    notes?: ReactNode;
    optionalLabel: ReactNode;
    recurrence: ReactNode;
    sequenceOrder: number;
    title: ReactNode;
  }>;

export function ToolStepCard({
  actions,
  className,
  completedControl,
  duration,
  isCompleted = false,
  isMandatory,
  mandatoryLabel,
  notes,
  optionalLabel,
  recurrence,
  sequenceOrder,
  title,
  ...props
}: ToolStepCardProps) {
  return (
    <article
      className={cn(
        "bg-surface-container-lowest shadow-level-1 grid gap-3 rounded border p-4 transition",
        isCompleted ? "border-status-success" : "border-outline-variant",
        className,
      )}
      {...props}
    >
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        <div className="bg-surface-container text-primary-container inline-grid size-9 shrink-0 place-items-center rounded text-sm font-bold">
          {sequenceOrder}
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-on-surface text-base font-semibold">
            {title}
          </h4>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityStatusBadge
              label={isMandatory ? mandatoryLabel : optionalLabel}
              tone={isMandatory ? "critical" : "recent"}
            />
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
  );
}
