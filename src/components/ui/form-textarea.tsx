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
  }>;

export function FormTextarea({
  className,
  error,
  helpText,
  id,
  label,
  textareaClassName,
  ...props
}: FormTextareaProps) {
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
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary min-h-28 rounded border px-3 py-3 text-sm transition outline-none",
          error ? "border-error" : undefined,
          textareaClassName,
        )}
        id={id}
        {...props}
      />
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
