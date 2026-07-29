import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import {
  EmployeeShell,
  type EmployeeMobileBottomTabItem,
} from "@/components/layout";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type EmployeeLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function EmployeeLayout({
  children,
  params,
}: EmployeeLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireRole(locale, "employee");

  const messages = getMessages(locale);
  const tabs = [
    {
      active: true,
      href: `/${locale}/employee`,
      id: "tasks",
      label: t(messages, "navigation.employee.tasks"),
    },
    {
      href: `/${locale}/employee/notifications`,
      id: "notifications",
      label: t(messages, "navigation.employee.notifications"),
    },
    {
      href: `/${locale}/employee/history`,
      id: "history",
      label: t(messages, "navigation.employee.history"),
    },
    {
      href: `/${locale}/employee/profile`,
      id: "profile",
      label: t(messages, "navigation.employee.profile"),
    },
  ] satisfies readonly EmployeeMobileBottomTabItem[];

  return (
    <EmployeeShell
      logoAlt={t(messages, "foundation.appName")}
      navigationLabel={t(messages, "navigation.employee.label")}
      tabs={tabs}
    >
      {children}
    </EmployeeShell>
  );
}
