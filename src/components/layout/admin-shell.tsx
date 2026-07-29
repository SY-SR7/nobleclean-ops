import Image from "next/image";
import type { ReactNode } from "react";

import {
  AdminNavigation,
  type AdminNavigationItem,
} from "@/components/layout/admin-navigation";

export type { AdminNavigationItem };

type AdminShellProps = Readonly<{
  appName: string;
  children: ReactNode;
  logoAlt: string;
  navigation: readonly AdminNavigationItem[];
  navigationLabel: string;
}>;

export function AdminShell({
  appName,
  children,
  logoAlt,
  navigation,
  navigationLabel,
}: AdminShellProps) {
  return (
    <div className="bg-surface text-on-surface min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="border-outline-variant bg-primary-container text-on-primary hidden min-h-screen border-r lg:flex lg:flex-col">
        <div className="border-on-primary/15 border-b px-6 py-5">
          <Image
            alt={logoAlt}
            className="h-auto w-40"
            height={40}
            priority
            src="/logo.png"
            width={250}
          />
        </div>
        <AdminNavigation items={navigation} navigationLabel={navigationLabel} />
      </aside>

      <div className="min-w-0">
        <header className="border-outline-variant bg-surface-container-lowest px-mobile-margin flex min-h-16 items-center border-b lg:hidden">
          <Image
            alt={logoAlt}
            className="h-auto w-36"
            height={32}
            src="/logo.png"
            width={200}
          />
          <span className="sr-only">{appName}</span>
        </header>
        <main className="px-mobile-margin lg:px-desktop-margin min-w-0 py-6 lg:py-8">
          <div className="mx-auto grid max-w-[var(--nc-container-max)] gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-12">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
