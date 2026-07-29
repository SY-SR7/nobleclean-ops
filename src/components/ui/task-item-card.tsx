import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type TaskItemCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> &
  Readonly<{
    actions?: ReactNode;
    badge?: ReactNode;
    estimatedMinutes?: ReactNode;
    lastCleaned?: ReactNode;
    selected?: boolean;
    thumbnail?: ReactNode;
    title: ReactNode;
  }>;

export function TaskItemCard({
  actions,
  badge,
  className,
  estimatedMinutes,
  lastCleaned,
  selected = false,
  thumbnail,
  title,
  ...props
}: TaskItemCardProps) {
  return (
    <article
      className={cn(
        "bg-surface-container-lowest shadow-level-1 grid gap-4 rounded-lg border p-4 transition",
        selected
          ? "border-secondary bg-surface-accent"
          : "border-outline-variant hover:border-outline",
        className,
      )}
      {...props}
    >
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
        {thumbnail ? (
          <div className="bg-surface-container size-16 overflow-hidden rounded">
            {thumbnail}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="font-heading text-on-surface text-base font-semibold">
            {title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {badge}
            {estimatedMinutes ? (
              <span className="text-on-surface-variant text-sm">
                {estimatedMinutes}
              </span>
            ) : null}
            {lastCleaned ? (
              <span className="text-on-surface-variant text-sm">
                {lastCleaned}
              </span>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </article>
  );
}
