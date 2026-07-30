"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/layout/admin-navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui";
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
  logoAlt: _logoAlt,
  logoutLabel,
  navigation,
  navigationLabel,
  skipToContentLabel,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={cn(
        "bg-surface text-on-surface min-h-screen transition-[grid-template-columns] duration-300 lg:grid",
        sidebarOpen
          ? "lg:grid-cols-[18rem_1fr]"
          : "lg:grid-cols-[4.5rem_1fr]",
      )}
    >
      {/* Skip to content */}
      <a
        className="focus:bg-secondary focus:text-on-secondary focus:ring-secondary focus:ring-offset-surface sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:ring-2 focus:ring-offset-2 focus:outline-none"
        href="#admin-main"
      >
        {skipToContentLabel}
      </a>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "border-outline-variant bg-primary-container text-on-primary hidden border-r lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden",
          "transition-all duration-300",
          sidebarOpen ? "w-72" : "w-[4.5rem]",
        )}
      >
        {/* Header: two-tone — white logo area + dark toggle row */}
        <div className="shrink-0">
          {/* White strip: original logo colors are fully visible */}
          {sidebarOpen ? (
            <div className="bg-surface-container-lowest flex items-center justify-between px-5 py-4">
              <BrandLogo
                alt={_logoAlt}
                className="w-36"
                height={36}
                priority
                width={220}
              />
              <button
                aria-label="Sidebar schließen"
                className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                <PanelLeftClose className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            /* Collapsed: show only the toggle on the dark background */
            <div className="border-on-primary/15 flex min-h-[4.5rem] items-center justify-center border-b">
              <button
                aria-label="Sidebar öffnen"
                className="text-on-primary/60 hover:bg-primary hover:text-on-primary flex h-9 w-9 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <PanelLeftOpen className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {/* Subtle divider between white logo and dark nav */}
          {sidebarOpen && (
            <div className="bg-primary-container/80 h-1 w-full" />
          )}
        </div>

        {/* Navigation */}
        <AdminNavigation
          collapsed={!sidebarOpen}
          items={navigation}
          navigationLabel={navigationLabel}
        />

        {/* Logout */}
        <form
          action={logoutAction}
          className={cn(
            "border-on-primary/15 mt-auto shrink-0 border-t p-3",
          )}
        >
          <input name="locale" type="hidden" value={locale} />
          {sidebarOpen ? (
            <Button
              className="border-on-primary/30 text-on-primary hover:bg-primary hover:text-on-primary w-full justify-start"
              icon={<LogOut aria-hidden="true" />}
              size="sm"
              type="submit"
              variant="secondary"
            >
              {logoutLabel}
            </Button>
          ) : (
            <button
              aria-label={logoutLabel}
              className="text-on-primary/60 hover:bg-primary hover:text-on-primary flex h-9 w-full items-center justify-center rounded transition-colors"
              title={logoutLabel}
              type="submit"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          )}
        </form>
      </aside>

      {/* ── Main Content ── */}
      <div className="min-w-0">
        {/* Mobile header */}
        <header className="border-outline-variant bg-surface-container-lowest shadow-level-1 sticky top-0 z-30 border-b lg:hidden">
          <div className="px-mobile-margin flex min-h-16 items-center justify-between gap-3">
            <BrandLogo
              alt={_logoAlt}
              className="w-32"
              height={32}
              variant="light"
              width={200}
            />
            <form action={logoutAction}>
              <input name="locale" type="hidden" value={locale} />
              <Button
                icon={<LogOut aria-hidden="true" />}
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
            <div className="min-w-0 lg:col-span-12">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
