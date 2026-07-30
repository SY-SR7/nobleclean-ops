import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CheckboxTileProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  Readonly<{
    label: ReactNode;
    tone?: "plan" | "success";
  }>;

export function CheckboxTile({
  className,
  disabled,
  label,
  tone = "plan",
  ...props
}: CheckboxTileProps) {
  return (
    <label
      className={cn(
        "border-outline-variant bg-surface-container-lowest text-on-surface inline-flex min-h-11 items-center justify-center gap-2 rounded border px-3 text-xs font-bold tracking-normal uppercase transition",
        "focus-within:border-secondary focus-within:ring-secondary focus-within:ring-offset-surface-container-lowest focus-within:ring-2 focus-within:ring-offset-2",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-surface-accent cursor-pointer",
        className,
      )}
    >
      <input
        className={cn(
          "size-5 shrink-0",
          tone === "success" ? "accent-status-success" : "accent-secondary",
        )}
        disabled={disabled}
        type="checkbox"
        {...props}
      />
      <span className="min-w-0 truncate">{label}</span>
    </label>
  );
}
