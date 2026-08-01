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

  // Navigation uses ?tab= params — stays on the same /admin URL (SPA-style)
  const navigation = [
    {
      href: `/${locale}/admin`,
      id: "home",
      label: t(messages, "navigation.admin.home"),
    },
    {
      href: `/${locale}/admin?tab=clients`,
      id: "clients",
      label: t(messages, "navigation.admin.clients"),
    },
    {
      href: `/${locale}/admin?tab=staff`,
      id: "staff",
      label: t(messages, "navigation.admin.staff"),
    },
    {
      href: `/${locale}/admin?tab=sections`,
      id: "sectionsItems",
      label: t(messages, "navigation.admin.sectionsItems"),
    },
    {
      href: `/${locale}/admin?tab=schedule`,
      id: "schedule",
      label: t(messages, "navigation.admin.schedule"),
    },
    {
      href: `/${locale}/admin?tab=reports`,
      id: "reports",
      label: t(messages, "navigation.admin.reports"),
    },
    {
      href: `/${locale}/admin?tab=audit`,
      id: "audit",
      label: "Aktivitätsprotokoll",
    },
  ] satisfies readonly AdminNavigationItem[];

  return (
    <AdminShell
      locale={locale}
      logoAlt={t(messages, "foundation.appName")}
      logoutLabel={t(messages, "auth.logout.submit")}
      navigation={navigation}
      navigationLabel={t(messages, "navigation.admin.label")}
      skipToContentLabel={t(messages, "navigation.skipToContent")}
    >
      {children}
    </AdminShell>
  );
}
