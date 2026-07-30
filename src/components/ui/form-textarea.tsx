import type { ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type FormTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> &
  Readonly<{
    error?: ReactNode;
    helpText?: ReactNode;
    id: string;
    textareaClassName?: string;
    label: ReactNode;
    icon?: ReactNode;
  }>;

export function FormTextarea({
  className,
  error,
  helpText,
  id,
  label,
  icon,
  textareaClassName,
  ...props
}: FormTextareaProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={cn(
        "rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5 shadow-sm transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20",
        error && "border-error focus-within:border-error focus-within:ring-error/20",
        className,
      )}
    >
      <label
        className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1 cursor-pointer"
        htmlFor={id}
      >
        {icon && <span className="text-secondary">{icon}</span>}
        {label}
      </label>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full bg-transparent font-semibold text-on-surface text-sm outline-none placeholder:text-on-surface-variant/40 min-h-24 resize-y",
          textareaClassName,
        )}
        id={id}
        {...props}
      />
      {helpText ? (
        <p className="text-on-surface-variant text-xs mt-1" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="text-error text-xs font-semibold mt-1" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
