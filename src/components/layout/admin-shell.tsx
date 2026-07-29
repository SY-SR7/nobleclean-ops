import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/layout/admin-navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui";
import { logoutAction } from "@/features/auth/actions";
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
  return (
    <div className="bg-surface text-on-surface min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <a
        className="focus:bg-secondary focus:text-on-secondary focus:ring-secondary focus:ring-offset-surface sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:ring-2 focus:ring-offset-2 focus:outline-none"
        href="#admin-main"
      >
        {skipToContentLabel}
      </a>
      <aside className="border-outline-variant bg-primary-container text-on-primary hidden min-h-screen border-r lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <div className="border-on-primary/15 border-b px-6 py-5">
          <BrandLogo
            alt={logoAlt}
            className="w-40"
            height={40}
            priority
            width={250}
          />
        </div>
        <AdminNavigation items={navigation} navigationLabel={navigationLabel} />
        <form
          action={logoutAction}
          className="border-on-primary/15 mt-auto border-t p-3"
        >
          <input name="locale" type="hidden" value={locale} />
          <Button
            className="border-on-primary/30 text-on-primary hover:bg-primary hover:text-on-primary w-full justify-start"
            icon={<LogOut aria-hidden="true" />}
            size="sm"
            type="submit"
            variant="secondary"
          >
            {logoutLabel}
          </Button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="border-outline-variant bg-surface-container-lowest shadow-level-1 sticky top-0 z-30 border-b lg:hidden">
          <div className="px-mobile-margin flex min-h-16 items-center justify-between gap-3">
            <BrandLogo alt={logoAlt} className="w-36" height={32} width={200} />
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
