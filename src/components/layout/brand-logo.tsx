import Image from "next/image";

import { cn } from "@/lib/cn";

type BrandLogoProps = Readonly<{
  alt: string;
  className?: string;
  height: number;
  priority?: boolean;
  width: number;
}>;

export function BrandLogo({
  alt,
  className,
  height,
  priority = false,
  width,
}: BrandLogoProps) {
  return (
    <Image
      alt={alt}
      className={cn("h-auto", className)}
      height={height}
      priority={priority}
      src="/logo.png"
      width={width}
    />
  );
}
