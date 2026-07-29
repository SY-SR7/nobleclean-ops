import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = {
  danger:
    "bg-error text-on-error hover:bg-error-container hover:text-on-error-container",
  ghost: "bg-transparent text-primary-container hover:bg-surface-container-low",
  primary:
    "bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container",
  secondary:
    "border border-primary-container bg-transparent text-primary-container hover:bg-surface-accent",
} as const;

const buttonSizes = {
  sm: "h-9 gap-2 px-3 text-xs",
  md: "h-12 gap-2 px-4 text-sm",
  lg: "h-14 gap-3 px-5 text-base",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{
    icon?: ReactNode;
    iconPosition?: "end" | "start";
    isLoading?: boolean;
    size?: ButtonSize;
    variant?: ButtonVariant;
  }>;

export function Button({
  children,
  className,
  disabled,
  icon,
  iconPosition = "start",
  isLoading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const renderedIcon = icon ? (
    <span className="inline-flex size-4 shrink-0 items-center justify-center">
      {icon}
    </span>
  ) : null;

  return (
    <button
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded font-bold tracking-normal uppercase transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {iconPosition === "start" ? renderedIcon : null}
      <span className="min-w-0 truncate">{children}</span>
      {iconPosition === "end" ? renderedIcon : null}
    </button>
  );
}
