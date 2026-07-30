import { notFound } from "next/navigation";
import Link from "next/link";

import { MetricCard } from "@/components/ui";
import { EmployeeAvailabilityPicker } from "@/features/employee/EmployeeAvailabilityPicker";
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

export default async function EmployeeProfilePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireRole(locale, "employee");
  const messages = getMessages(locale);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-primary-container text-2xl font-bold">
            {t(messages, "navigation.employee.profile")}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {session.profile.fullName}
          </p>
        </div>
        <Link
          className="bg-secondary text-on-secondary inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-xs font-bold transition hover:opacity-90 shadow-sm"
          href={`/${locale}/employee`}
        >
          {t(messages, "navigation.employee.tasks")}
        </Link>
      </header>

      {/* Employee Availability Picker for next month */}
      <EmployeeAvailabilityPicker
        employeeName={session.profile.fullName}
        locale={locale}
      />
    </div>
  );
}
