import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { LeafItemStatusTone, SystemStatusTone } from "@/lib/design-tokens";

type StatusTone = LeafItemStatusTone | SystemStatusTone;

const badgeToneClasses: Record<StatusTone, string> = {
  critical: "border-status-critical text-status-critical",
  recent: "border-status-recent text-status-recent",
  success: "border-status-success text-status-success",
  warning: "border-status-warning text-status-warning",
};

const dotToneClasses: Record<StatusTone, string> = {
  critical: "bg-status-critical",
  recent: "bg-status-recent",
  success: "bg-status-success",
  warning: "bg-status-warning",
};

type PriorityStatusBadgeProps = HTMLAttributes<HTMLSpanElement> &
  Readonly<{
    label: ReactNode;
    tone: StatusTone;
  }>;

export function PriorityStatusBadge({
  className,
  label,
  tone,
  ...props
}: PriorityStatusBadgeProps) {
  return (
    <span
      className={cn(
        "bg-surface-container-lowest inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-normal uppercase",
        badgeToneClasses[tone],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dotToneClasses[tone])}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
