import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { LeafItemStatusTone, SystemStatusTone } from "@/lib/design-tokens";

type MetricStatusTone = LeafItemStatusTone | SystemStatusTone;

const accentClasses: Record<MetricStatusTone, string> = {
  critical: "border-l-status-critical",
  recent: "border-l-status-recent",
  success: "border-l-status-success",
  warning: "border-l-status-warning",
};

type MetricCardProps = HTMLAttributes<HTMLElement> &
  Readonly<{
    label: ReactNode;
    metadata?: ReactNode;
    statusTone?: MetricStatusTone;
    value: ReactNode;
  }>;

export function MetricCard({
  className,
  label,
  metadata,
  statusTone,
  value,
  ...props
}: MetricCardProps) {
  return (
    <section
      className={cn(
        "border-outline-variant bg-surface-container-lowest shadow-level-1 rounded-lg border p-4",
        statusTone ? "border-l-4" : undefined,
        statusTone ? accentClasses[statusTone] : undefined,
        className,
      )}
      {...props}
    >
      <div className="font-heading text-primary-container text-3xl font-bold">
        {value}
      </div>
      <div className="text-on-surface-variant mt-2 text-sm">{label}</div>
      {metadata ? (
        <div className="text-secondary mt-3 text-xs font-bold tracking-normal uppercase">
          {metadata}
        </div>
      ) : null}
    </section>
  );
}
