import { Search, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> &
  Readonly<{
    clearLabel?: string;
    error?: ReactNode;
    helpText?: ReactNode;
    id: string;
    label: ReactNode;
    onClear?: () => void;
    showClear?: boolean;
  }>;

export function SearchInput({
  className,
  clearLabel,
  error,
  helpText,
  id,
  label,
  onClear,
  showClear = false,
  ...props
}: SearchInputProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label
        className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            "border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 w-full rounded border pr-10 pl-10 text-sm transition outline-none",
            error ? "border-error" : undefined,
          )}
          id={id}
          type="search"
          {...props}
        />
        {showClear && onClear && clearLabel ? (
          <button
            aria-label={clearLabel}
            className="text-outline hover:bg-surface-container-low hover:text-on-surface absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded transition"
            onClick={onClear}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      {helpText ? (
        <p className="text-on-surface-variant text-sm" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="text-error text-sm" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
