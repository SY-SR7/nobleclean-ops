import Image from "next/image";
import type { ReactNode } from "react";

import {
  EmployeeMobileBottomTabs,
  type EmployeeMobileBottomTabItem,
} from "@/components/ui";

type EmployeeShellProps = Readonly<{
  appName: string;
  children: ReactNode;
  logoAlt: string;
  navigationLabel: string;
  tabs: readonly EmployeeMobileBottomTabItem[];
}>;

export function EmployeeShell({
  appName,
  children,
  logoAlt,
  navigationLabel,
  tabs,
}: EmployeeShellProps) {
  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 md:pb-8">
      <header className="border-outline-variant bg-surface-container-lowest px-mobile-margin shadow-level-1 md:px-desktop-margin sticky top-0 z-30 border-b py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Image
            alt={logoAlt}
            className="h-auto w-40"
            height={36}
            priority
            src="/logo.png"
            width={225}
          />
          <span className="sr-only">{appName}</span>
        </div>
      </header>
      <main className="px-mobile-margin md:px-desktop-margin mx-auto w-full max-w-3xl py-6">
        {children}
      </main>
      <EmployeeMobileBottomTabs items={tabs} label={navigationLabel} />
    </div>
  );
}
