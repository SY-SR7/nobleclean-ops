import Link from "next/link";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

// ── EntityLink ────────────────────────────────────────────────────────────────
// Shared link component for navigating to entity detail pages.
// Used everywhere an employee or client name renders in the admin surface.

export type EntityType = "client" | "employee";

export type EntityLinkProps = Readonly<{
  id: string;
  name: string;
  type: EntityType;
  locale: Locale;
  className?: string;
  /** Show small initials avatar badge next to the name */
  showInitials?: boolean;
}>;

function getHref(type: EntityType, id: string, locale: string): string {
  if (type === "employee") return `/${locale}/admin/staff/${id}`;
  if (type === "client") return `/${locale}/admin/clients/${id}`;
  return "#";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-500",
  ];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function EntityLink({
  id,
  name,
  type,
  locale,
  className,
  showInitials = false,
}: EntityLinkProps) {
  const href = getHref(type, id, locale);
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-on-surface transition-colors hover:text-secondary",
        className,
      )}
    >
      {showInitials && (
        <span
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white",
            gradient,
          )}
        >
          {initials}
        </span>
      )}
      <span className="truncate">{name}</span>
    </Link>
  );
}
