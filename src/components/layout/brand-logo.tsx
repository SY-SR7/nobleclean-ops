import Image from "next/image";

import { cn } from "@/lib/cn";

type BrandLogoProps = Readonly<{
  alt: string;
  className?: string;
  height: number;
  priority?: boolean;
  /**
   * "dark"  → logo on dark sidebar background: invert to white
   * "light" → logo on light header background: original colors
   */
  variant?: "dark" | "light";
  width: number;
}>;

export function BrandLogo({
  alt,
  className,
  height,
  priority = false,
  variant = "light",
  width,
}: BrandLogoProps) {
  return (
    <Image
      alt={alt}
      className={cn(
        "h-auto",
        // On dark backgrounds invert the logo so it appears white/readable.
        // This is the standard industry technique (Slack, Notion, Linear…).
        variant === "dark" && "brightness-0 invert",
        className,
      )}
      height={height}
      priority={priority}
      src="/logo.png"
      width={width}
    />
  );
}
