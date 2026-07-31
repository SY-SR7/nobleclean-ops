import { notFound } from "next/navigation";

import { ClientDetailInteractive } from "@/features/admin/clients/client-detail/ClientDetailInteractive";
import { getClientDetailData } from "@/features/admin/clients/client-detail/queries";
import { getStaffAssignmentsData } from "@/features/admin/staff/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type PageProps = Readonly<{
  params: Promise<{ locale: string; clientId: string }>;
}>;

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { locale: rawLocale, clientId } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  await requireRole(locale, "admin");

  const [data, staffData] = await Promise.all([
    getClientDetailData(locale, clientId),
    getStaffAssignmentsData(locale),
  ]);

  if (!data.ok || !data.client) {
    notFound();
  }

  const messages = getMessages(locale);

  const copy = {
    addressLabel: t(messages, "adminClients.fields.address"),
    assignedEmployeesTitle: t(
      messages,
      "adminClients.clientDetail.assignedEmployeesTitle",
    ),
    backToClients: t(messages, "adminClients.clientDetail.backToClients"),
    contactEmailLabel: t(messages, "adminClients.fields.contactEmail"),
    contactNameLabel: t(messages, "adminClients.fields.contactName"),
    contactNotesLabel: t(messages, "adminClients.fields.contactNotes"),
    contactPhoneLabel: t(messages, "adminClients.fields.contactPhone"),
    emptyAssignedEmployees: t(
      messages,
      "adminClients.clientDetail.emptyAssignedEmployees",
    ),
    emptyRecentPlans: t(
      messages,
      "adminClients.clientDetail.emptyRecentPlans",
    ),
    emptySections: t(messages, "adminClients.clientDetail.emptySections"),
    notAvailable: t(messages, "adminClients.clientDetail.notAvailable"),
    planItemsCompletedLabel: t(
      messages,
      "adminClients.clientDetail.planItemsCompleted",
    ),
    planStatusInProgress: t(
      messages,
      "adminClients.clientDetail.planStatus.in_progress",
    ),
    planStatusSubmitted: t(
      messages,
      "adminClients.clientDetail.planStatus.submitted",
    ),
    profileTitle: t(messages, "adminClients.clientDetail.profileTitle"),
    recentPlansTitle: t(
      messages,
      "adminClients.clientDetail.recentPlansTitle",
    ),
    rootSection: t(messages, "adminClients.clientDetail.rootSection"),
    sectionsTitle: t(messages, "adminClients.clientDetail.sectionsTitle"),
    statusActive: t(messages, "adminClients.status.active"),
    statusInactive: t(messages, "adminClients.status.inactive"),
    title: t(messages, "adminClients.clientDetail.title"),
    viewEmployee: t(messages, "adminClients.clientDetail.viewEmployee"),
    avatarChangeLabel: t(messages, "adminClients.clientDetail.avatar.change"),
    avatarUploadLabel: t(messages, "adminClients.clientDetail.avatar.upload"),
    avatarSavedLabel: t(messages, "adminClients.clientDetail.avatar.saved"),
    avatarErrorLabel: t(messages, "adminClients.clientDetail.avatar.error"),
    // Inline-edit UI strings — fall back to hard-coded defaults if missing
    savedLabel: "Gespeichert",
    errorLabel: "Fehler beim Speichern",
    endAssignmentLabel: "Beenden",
    endAssignmentConfirmTitle: "Zuweisung beenden?",
    endAssignmentConfirmBody:
      "Die Zuweisung dieses Mitarbeiters wird zum heutigen Datum beendet.",
    confirmLabel: "Beenden",
    cancelLabel: "Abbrechen",
    addAssignmentLabel: "Zuweisung hinzufügen",
    employeeLabel: "Mitarbeiter",
    startDateLabel: "Von",
    endDateLabel: "Bis (optional)",
    saveLabel: "Speichern",
    // Employee list for the assignment form
    employees: staffData.employees,
  };

  return (
    <ClientDetailInteractive copy={copy} data={data} locale={locale} />
  );
}
