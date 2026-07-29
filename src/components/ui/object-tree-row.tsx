import { ChevronDown, ChevronRight, Folder, MapPin } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ObjectTreeRowProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{
    active?: boolean;
    collapseLabel?: string;
    expanded?: boolean;
    expandLabel?: string;
    hasChildren?: boolean;
    kind?: "leaf" | "section";
    level?: number;
    meta?: ReactNode;
    title: ReactNode;
    trailing?: ReactNode;
  }>;

export function ObjectTreeRow({
  active = false,
  className,
  collapseLabel,
  expanded = false,
  expandLabel,
  hasChildren = false,
  kind = "section",
  level = 0,
  meta,
  style,
  title,
  trailing,
  type = "button",
  ...props
}: ObjectTreeRowProps) {
  const safeLevel = Math.max(0, level);
  const TreeIcon = kind === "leaf" ? MapPin : Folder;
  const DisclosureIcon = expanded ? ChevronDown : ChevronRight;
  const disclosureLabel = expanded ? collapseLabel : expandLabel;
  const levelStyle = {
    paddingInlineStart: `calc(var(--nc-spacing-base) + ${safeLevel} * var(--nc-spacing-gutter))`,
    ...style,
  } satisfies CSSProperties;

  return (
    <button
      className={cn(
        "grid min-h-12 w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-l-4 py-2 pr-3 text-left transition",
        active
          ? "border-l-primary-container bg-surface-accent"
          : "bg-surface-container-lowest hover:bg-surface-container-low border-l-transparent",
        className,
      )}
      style={levelStyle}
      type={type}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        {hasChildren ? (
          <DisclosureIcon
            aria-label={disclosureLabel}
            className="text-outline size-4"
          />
        ) : (
          <span aria-hidden="true" className="size-4" />
        )}
        <TreeIcon
          aria-hidden="true"
          className="text-primary-container size-4"
        />
      </span>
      <span className="min-w-0">
        <span className="text-on-surface block truncate text-sm font-semibold">
          {title}
        </span>
        {meta ? (
          <span className="text-on-surface-variant mt-1 block truncate text-xs">
            {meta}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="justify-self-end">{trailing}</span> : null}
    </button>
  );
}
