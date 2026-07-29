import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AdminShell, type AdminNavigationItem } from "@/components/layout";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireRole(locale, "admin");

  const messages = getMessages(locale);
  const navigation = [
    {
      href: `/${locale}/admin`,
      id: "home",
      label: t(messages, "navigation.admin.home"),
    },
    {
      href: `/${locale}/admin/clients`,
      id: "clients",
      label: t(messages, "navigation.admin.clients"),
    },
    {
      href: `/${locale}/admin/staff`,
      id: "staff",
      label: t(messages, "navigation.admin.staff"),
    },
    {
      href: `/${locale}/admin/sections-items`,
      id: "sectionsItems",
      label: t(messages, "navigation.admin.sectionsItems"),
    },
    {
      href: `/${locale}/admin/schedule`,
      id: "schedule",
      label: t(messages, "navigation.admin.schedule"),
    },
    {
      href: `/${locale}/admin/reports`,
      id: "reports",
      label: t(messages, "navigation.admin.reports"),
    },
  ] satisfies readonly AdminNavigationItem[];

  return (
    <AdminShell
      appName={t(messages, "foundation.appName")}
      logoAlt={t(messages, "foundation.appName")}
      navigation={navigation}
      navigationLabel={t(messages, "navigation.admin.label")}
    >
      {children}
    </AdminShell>
  );
}
