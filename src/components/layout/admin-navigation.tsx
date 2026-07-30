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
  collapsed?: boolean;
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
  collapsed = false,
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
            key={item.id}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "focus-visible:ring-secondary inline-flex min-h-10 items-center gap-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2",
              collapsed && !isMobile ? "w-full justify-center px-0" : "px-3",
              // Active state — same for both mobile and sidebar
              active
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : undefined,
              // Inactive — light sidebar style
              !active && !isMobile
                ? "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                : undefined,
              // Inactive — mobile scrollable strip
              !active && isMobile
                ? "text-on-surface-variant hover:bg-surface-container"
                : undefined,
            )}
            href={item.href}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {!collapsed && (
              <span className="min-w-0 truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
