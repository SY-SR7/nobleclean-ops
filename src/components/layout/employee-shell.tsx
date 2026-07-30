import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Button,
  EmployeeMobileBottomTabs,
  type EmployeeMobileBottomTabItem,
} from "@/components/ui";
import { logoutAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/routing";

type EmployeeShellProps = Readonly<{
  children: ReactNode;
  locale: Locale;
  logoAlt: string;
  logoutLabel: string;
  navigationLabel: string;
  tabs: readonly EmployeeMobileBottomTabItem[];
}>;

export function EmployeeShell({
  children,
  locale,
  logoAlt,
  logoutLabel,
  navigationLabel,
  tabs,
}: EmployeeShellProps) {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-8">
      <header className="border-outline-variant bg-surface-container-lowest px-mobile-margin shadow-level-1 md:px-desktop-margin sticky top-0 z-30 border-b py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <BrandLogo
            alt={logoAlt}
            className="w-40"
            height={36}
            priority
            width={225}
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
      </header>
      <main className="px-mobile-margin md:px-desktop-margin mx-auto w-full max-w-3xl py-6">
        {children}
      </main>
      <EmployeeMobileBottomTabs items={tabs} label={navigationLabel} />
    </div>
  );
}
