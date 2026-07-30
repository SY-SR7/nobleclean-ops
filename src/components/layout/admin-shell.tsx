"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/layout/admin-navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button, DetailDrawerProvider } from "@/components/ui";
import { AdminSpaProvider } from "@/context/admin-spa-context";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";

export type { AdminNavigationItem };

type AdminShellProps = Readonly<{
  children: ReactNode;
  locale: Locale;
  logoAlt: string;
  logoutLabel: string;
  navigation: readonly AdminNavigationItem[];
  navigationLabel: string;
  skipToContentLabel: string;
}>;

export function AdminShell({
  children,
  locale,
  logoAlt,
  logoutLabel,
  navigation,
  navigationLabel,
  skipToContentLabel,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={cn(
        "bg-surface text-on-surface min-h-screen lg:grid",
        sidebarOpen
          ? "lg:grid-cols-[16rem_1fr]"
          : "lg:grid-cols-[4rem_1fr]",
        "transition-[grid-template-columns] duration-300 ease-in-out",
      )}
    >
      {/* Skip to content */}
      <a
        className="focus:bg-secondary focus:text-on-secondary focus:ring-secondary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:ring-2 focus:outline-none"
        href="#admin-main"
      >
        {skipToContentLabel}
      </a>

      {/* ── Desktop Sidebar (Light) ── */}
      <aside
        className={cn(
          "border-outline-variant bg-surface-container-lowest hidden border-r",
          "lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden",
          "relative transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        {/* Floating toggle button — sits on the right border, Notion-style */}
        <button
          aria-label={sidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
          className={cn(
            "border-outline-variant bg-surface-container-lowest text-on-surface-variant",
            "shadow-level-1 hover:bg-surface-container hover:text-secondary hover:border-secondary",
            "absolute top-5 -right-3.5 z-50",
            "flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40",
          )}
          onClick={() => setSidebarOpen((v) => !v)}
          type="button"
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden="true" />
          )}
        </button>

        {/* Logo */}
        <div
          className={cn(
            "border-outline-variant flex min-h-[3.75rem] shrink-0 items-center border-b",
            sidebarOpen ? "px-5" : "justify-center px-0",
          )}
        >
          {sidebarOpen ? (
            <BrandLogo
              alt={logoAlt}
              className="w-32"
              height={32}
              priority
              width={200}
            />
          ) : (
            /* Collapsed: show "NC" monogram */
            <span className="text-secondary font-heading text-sm font-bold select-none">
              NC
            </span>
          )}
        </div>

        {/* Navigation */}
        <AdminNavigation
          collapsed={!sidebarOpen}
          items={navigation}
          navigationLabel={navigationLabel}
          variant="sidebar"
        />

        {/* Logout */}
        <form
          action={logoutAction}
          className="border-outline-variant mt-auto shrink-0 border-t p-2"
        >
          <input name="locale" type="hidden" value={locale} />
          {sidebarOpen ? (
            <Button
              className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface w-full justify-start"
              icon={<LogOut className="size-4" aria-hidden="true" />}
              size="sm"
              type="submit"
              variant="ghost"
            >
              {logoutLabel}
            </Button>
          ) : (
            <button
              aria-label={logoutLabel}
              className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-9 w-full items-center justify-center rounded transition-colors"
              title={logoutLabel}
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>
      </aside>

      {/* ── Main Content ── */}
      <div className="min-w-0">
        {/* Mobile header */}
        <header className="border-outline-variant bg-surface-container-lowest shadow-level-1 sticky top-0 z-30 border-b lg:hidden">
          <div className="px-mobile-margin flex min-h-14 items-center justify-between gap-3">
            <BrandLogo alt={logoAlt} className="w-28" height={28} width={180} />
            <form action={logoutAction}>
              <input name="locale" type="hidden" value={locale} />
              <Button
                icon={<LogOut className="size-4" aria-hidden="true" />}
                size="sm"
                type="submit"
                variant="ghost"
              >
                {logoutLabel}
              </Button>
            </form>
          </div>
          <AdminNavigation
            items={navigation}
            navigationLabel={navigationLabel}
            variant="mobile"
          />
        </header>

        <main
          className="px-mobile-margin lg:px-desktop-margin min-w-0 py-6 lg:py-8"
          id="admin-main"
          tabIndex={-1}
        >
          <div className="mx-auto grid max-w-[var(--nc-container-max)] gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-12">
              <AdminSpaProvider>
                <DetailDrawerProvider>
                  {children}
                </DetailDrawerProvider>
              </AdminSpaProvider>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

