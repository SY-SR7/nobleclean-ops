"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  Home,
  ListTree,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const adminNavigationIcons = {
  clients: Building2,
  home: Home,
  reports: BarChart3,
  schedule: CalendarDays,
  sectionsItems: ListTree,
  staff: Users,
} satisfies Record<string, LucideIcon>;

export type AdminNavigationItem = Readonly<{
  href: string;
  id: keyof typeof adminNavigationIcons;
  label: string;
}>;

type AdminNavigationProps = Readonly<{
  className?: string;
  items: readonly AdminNavigationItem[];
  navigationLabel: string;
  variant?: "mobile" | "sidebar";
}>;

function isActivePath(pathname: string, item: AdminNavigationItem) {
  if (pathname === item.href) {
    return true;
  }

  return item.id !== "home" && pathname.startsWith(`${item.href}/`);
}

export function AdminNavigation({
  className,
  items,
  navigationLabel,
  variant = "sidebar",
}: AdminNavigationProps) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav
      aria-label={navigationLabel}
      className={cn(
        isMobile
          ? "px-mobile-margin flex gap-2 overflow-x-auto py-2"
          : "grid gap-1 p-3",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = adminNavigationIcons[item.id];
        const active = isActivePath(pathname, item);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-secondary focus-visible:ring-offset-surface inline-flex min-h-11 items-center gap-3 rounded px-3 text-sm font-semibold whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              active && isMobile
                ? "bg-secondary-container text-on-secondary-container"
                : undefined,
              active && !isMobile
                ? "bg-secondary-container text-on-secondary-container"
                : undefined,
              !active && isMobile
                ? "text-primary-container hover:bg-surface-accent"
                : undefined,
              !active && !isMobile
                ? "text-inverse-on-surface hover:bg-primary hover:text-on-primary"
                : undefined,
            )}
            href={item.href}
            key={item.id}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
