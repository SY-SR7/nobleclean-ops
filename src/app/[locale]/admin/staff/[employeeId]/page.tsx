import { notFound } from "next/navigation";

import { EmployeeDetailInteractive } from "@/features/admin/staff/employee-detail/EmployeeDetailInteractive";
import { getEmployeeDetailData } from "@/features/admin/staff/employee-detail/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type PageProps = Readonly<{
  params: Promise<{ locale: string; employeeId: string }>;
}>;

export default async function AdminEmployeeDetailPage({ params }: PageProps) {
  const { locale: rawLocale, employeeId } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  await requireRole(locale, "admin");

  const data = await getEmployeeDetailData(locale, employeeId);

  if (!data.ok || !data.employee) {
    notFound();
  }

  const messages = getMessages(locale);
  const weekdayLabels = [0, 1, 2, 3, 4, 5, 6].map((day) =>
    t(messages, `staff.employeeDetail.weekdays.${day}`),
  );

  const copy = {
    available: t(messages, "staff.employeeDetail.availabilityStatus.available"),
    availabilityHint: t(messages, "staff.employeeDetail.availabilityHint"),
    availabilityTitle: t(messages, "staff.employeeDetail.availabilityTitle"),
    assignmentHistoryTitle: t(
      messages,
      "staff.employeeDetail.assignmentHistoryTitle",
    ),
    backToStaff: t(messages, "staff.employeeDetail.backToStaff"),
    emptyAssignmentHistory: t(
      messages,
      "staff.employeeDetail.emptyAssignmentHistory",
    ),
    emptyRecentPlans: t(messages, "staff.employeeDetail.emptyRecentPlans"),
    fullNameLabel: t(messages, "staff.employeeDetail.fields.fullName"),
    planItemsCompletedLabel: t(
      messages,
      "staff.employeeDetail.planItemsCompleted",
    ),
    planStatusInProgress: t(
      messages,
      "staff.employeeDetail.planStatus.in_progress",
    ),
    planStatusSubmitted: t(
      messages,
      "staff.employeeDetail.planStatus.submitted",
    ),
    profileError: t(messages, "staff.employeeDetail.feedback.profileError"),
    profileSaved: t(messages, "staff.employeeDetail.feedback.profileSaved"),
    defaultDailyHoursLabel: t(
      messages,
      "staff.employeeDetail.defaultDailyHours.label",
    ),
    defaultDailyHoursHint: t(
      messages,
      "staff.employeeDetail.defaultDailyHours.hint",
    ),
    defaultDailyHoursSaved: t(
      messages,
      "staff.employeeDetail.feedback.defaultDailyHoursSaved",
    ),
    defaultDailyHoursError: t(
      messages,
      "staff.employeeDetail.feedback.defaultDailyHoursError",
    ),
    profileTitle: t(messages, "staff.employeeDetail.profileTitle"),
    recentPlansTitle: t(messages, "staff.employeeDetail.recentPlansTitle"),
    roleAdmin: t(messages, "staff.employeeDetail.roleValues.admin"),
    roleEmployee: t(messages, "staff.employeeDetail.roleValues.employee"),
    roleLabel: t(messages, "staff.employeeDetail.fields.role"),
    saveProfile: t(messages, "staff.employeeDetail.actions.saveProfile"),
    avatarChangeLabel: t(messages, "staff.employeeDetail.avatar.change"),
    avatarUploadLabel: t(messages, "staff.employeeDetail.avatar.upload"),
    avatarSavedLabel: t(messages, "staff.employeeDetail.avatar.saved"),
    avatarErrorLabel: t(messages, "staff.employeeDetail.avatar.error"),
    statusActive: t(messages, "staff.status.active"),
    statusInactive: t(messages, "staff.status.inactive"),
    title: t(messages, "staff.employeeDetail.title"),
    unavailable: t(
      messages,
      "staff.employeeDetail.availabilityStatus.unavailable",
    ),
    weekdayLabels,
    savedLabel: t(messages, "staff.employeeDetail.feedback.profileSaved"),
    errorLabel: t(messages, "staff.employeeDetail.feedback.profileError"),
  };

  return <EmployeeDetailInteractive copy={copy} data={data} locale={locale} />;
}
