import { cn } from "@/lib/cn";

type BrandLogoProps = Readonly<{
  className?: string;
  /** "dark" = on dark sidebar bg (noble=white, clean=cyan)
   *  "light" = on light header bg (noble=navy, clean=teal) */
  variant?: "dark" | "light";
}>;

export function BrandLogo({
  className,
  variant = "light",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  return (
    <span
      aria-label="nobleclean"
      className={cn(
        "select-none font-heading text-2xl font-bold tracking-tight leading-none",
        className,
      )}
    >
      <span
        className={cn(
          isDark ? "text-white" : "text-primary-container",
        )}
      >
        noble
      </span>
      <span
        className={cn(
          isDark ? "text-secondary-container" : "text-secondary",
        )}
      >
        clean
      </span>
    </span>
  );
}
