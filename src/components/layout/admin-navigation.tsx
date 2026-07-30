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

import { useAdminSpa, type AdminTab } from "@/context/admin-spa-context";
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

const tabParamMap: Record<string, AdminTab> = {
  home: "home",
  clients: "clients",
  staff: "staff",
  sectionsItems: "sections",
  schedule: "schedule",
  reports: "reports",
};

export function AdminNavigation({
  className,
  collapsed = false,
  items,
  navigationLabel,
  variant = "sidebar",
}: AdminNavigationProps) {
  const { activeTab, setActiveTab } = useAdminSpa();
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
        const targetTab = tabParamMap[item.id] ?? "home";
        const active = activeTab === targetTab;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            onClick={() => setActiveTab(targetTab)}
            className={cn(
              "focus-visible:ring-secondary inline-flex min-h-10 items-center gap-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 cursor-pointer select-none border-0 text-left w-full",
              collapsed && !isMobile ? "w-full justify-center px-0" : "px-3",
              active
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : undefined,
              !active && !isMobile
                ? "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                : undefined,
              !active && isMobile
                ? "text-on-surface-variant hover:bg-surface-container"
                : undefined,
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {!collapsed && (
              <span className="min-w-0 truncate">{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
