import { notFound } from "next/navigation";
import Link from "next/link";

import { MetricCard } from "@/components/ui";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type PageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function EmployeeNotificationsPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireRole(locale, "employee");

  const messages = getMessages(locale);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {t(messages, "navigation.employee.notifications")}
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          {t(messages, "foundation.appName")}
        </p>
      </header>

      <MetricCard
        label={t(messages, "navigation.employee.notifications")}
        statusTone="neutral"
        value="0"
      />

      <div className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded border p-6">
        <p className="text-on-surface-variant text-sm">
          {t(messages, "navigation.employee.notifications")} — Placeholder
        </p>
        <div>
          <Link
            className="border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high focus-visible:ring-secondary focus-visible:ring-offset-surface-container-lowest inline-flex min-h-11 items-center justify-center rounded border px-4 py-2 text-sm font-bold transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            href={`/${locale}/employee`}
          >
            {t(messages, "navigation.employee.tasks")}
          </Link>
        </div>
      </div>
    </div>
  );
}
