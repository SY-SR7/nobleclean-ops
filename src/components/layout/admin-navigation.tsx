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
  items: readonly AdminNavigationItem[];
  navigationLabel: string;
}>;

function isActivePath(pathname: string, item: AdminNavigationItem) {
  if (pathname === item.href) {
    return true;
  }

  return item.id !== "home" && pathname.startsWith(`${item.href}/`);
}

export function AdminNavigation({
  items,
  navigationLabel,
}: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={navigationLabel} className="grid gap-1 p-3">
      {items.map((item) => {
        const Icon = adminNavigationIcons[item.id];
        const active = isActivePath(pathname, item);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-3 rounded px-3 text-sm font-semibold transition",
              active
                ? "bg-secondary-container text-on-secondary-container"
                : "text-inverse-on-surface hover:bg-primary hover:text-on-primary",
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
