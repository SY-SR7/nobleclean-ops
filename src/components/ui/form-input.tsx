import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> &
  Readonly<{
    error?: ReactNode;
    helpText?: ReactNode;
    id: string;
    inputClassName?: string;
    label: ReactNode;
  }>;

export function FormInput({
  className,
  error,
  helpText,
  id,
  inputClassName,
  label,
  ...props
}: FormInputProps) {
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
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary focus-visible:border-secondary focus-visible:ring-secondary focus-visible:ring-offset-surface-container-lowest h-12 rounded border px-3 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          error ? "border-error" : undefined,
          inputClassName,
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
