import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ProgressIndicatorProps = HTMLAttributes<HTMLDivElement> &
  Readonly<{
    label?: ReactNode;
    max?: number;
    mode?: "linear" | "ring";
    value: number;
    valueLabel?: ReactNode;
  }>;

function clampPercentage(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function ProgressIndicator({
  className,
  label,
  max = 100,
  mode = "linear",
  value,
  valueLabel,
  ...props
}: ProgressIndicatorProps) {
  const percentage = clampPercentage(value, max);
  const ariaLabel = typeof label === "string" ? label : undefined;

  if (mode === "ring") {
    return (
      <div
        aria-label={ariaLabel}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={value}
        className={cn("inline-grid place-items-center gap-2", className)}
        role="progressbar"
        {...props}
      >
        <svg
          aria-hidden="true"
          className="size-16 -rotate-90"
          viewBox="0 0 36 36"
        >
          <circle
            className="stroke-surface-container"
            cx="18"
            cy="18"
            fill="none"
            r="15.9155"
            strokeWidth="3"
          />
          <circle
            className="stroke-secondary"
            cx="18"
            cy="18"
            fill="none"
            pathLength="100"
            r="15.9155"
            strokeDasharray={`${percentage} 100`}
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        {label || valueLabel ? (
          <span className="text-on-surface-variant text-center text-sm">
            {valueLabel ?? label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("grid gap-2", className)}
      role="progressbar"
      {...props}
    >
      {label || valueLabel ? (
        <div className="text-on-surface-variant flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">{label}</span>
          {valueLabel ? <span className="shrink-0">{valueLabel}</span> : null}
        </div>
      ) : null}
      <div className="bg-surface-container h-2 overflow-hidden rounded-full">
        <div
          className="bg-secondary h-full rounded-full"
          style={{ width: `${percentage}%` } satisfies CSSProperties}
        />
      </div>
    </div>
  );
}
