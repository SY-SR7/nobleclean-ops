"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  ClipboardList,
  Layers,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
} from "lucide-react";

import type { Locale } from "@/i18n/routing";
import type {
  ClientAssignedEmployee,
  ClientDetailData,
  ClientRecentPlan,
  ClientSectionSummary,
} from "./queries";

export type ClientDetailCopy = Readonly<{
  backToClients: string;
  profileTitle: string;
  addressLabel: string;
  contactNameLabel: string;
  contactEmailLabel: string;
  contactPhoneLabel: string;
  contactNotesLabel: string;
  statusActive: string;
  statusInactive: string;
  assignedEmployeesTitle: string;
  emptyAssignedEmployees: string;
  recentPlansTitle: string;
  emptyRecentPlans: string;
  sectionsTitle: string;
  emptySections: string;
  planStatusInProgress: string;
  planStatusSubmitted: string;
  planItemsCompleted: (completed: number, total: number) => string;
  notAvailable: string;
  viewEmployee: string;
  rootSection: string;
}>;

type ClientDetailInteractiveProps = Readonly<{
  data: ClientDetailData;
  locale: Locale;
  copy: ClientDetailCopy;
}>;

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function ProfileSection({
  client,
  copy,
}: Readonly<{
  client: ClientDetailData["client"];
  copy: ClientDetailCopy;
}>) {
  if (!client) return null;

  const fields = [
    {
      icon: <MapPin className="size-4" />,
      label: copy.addressLabel,
      value: client.address || "—",
    },
    {
      icon: <User className="size-4" />,
      label: copy.contactNameLabel,
      value: client.contactName || "—",
    },
    {
      icon: <Mail className="size-4" />,
      label: copy.contactEmailLabel,
      value: client.contactEmail || "—",
    },
    {
      icon: <Phone className="size-4" />,
      label: copy.contactPhoneLabel,
      value: client.contactPhone || "—",
    },
  ];

  return (
    <section className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded-2xl border p-5">
      <h2 className="font-heading text-primary-container text-lg font-bold">
        {copy.profileTitle}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="border-outline-variant bg-surface-container flex items-start gap-3 rounded-xl border px-4 py-3"
          >
            <span className="text-on-surface-variant mt-0.5 shrink-0">
              {field.icon}
            </span>
            <div className="min-w-0">
              <p className="text-on-surface-variant text-xs font-medium">
                {field.label}
              </p>
              <p className="text-on-surface truncate text-sm font-semibold">
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      {client.contactNotes && (
        <div className="border-outline-variant bg-surface-container rounded-xl border px-4 py-3">
          <p className="text-on-surface-variant text-xs font-medium">
            {copy.contactNotesLabel}
          </p>
          <p className="text-on-surface mt-1 text-sm leading-relaxed">
            {client.contactNotes}
          </p>
        </div>
      )}
    </section>
  );
}

function AssignedEmployeesList({
  items,
  copy,
  locale,
}: Readonly<{
  items: readonly ClientAssignedEmployee[];
  copy: ClientDetailCopy;
  locale: Locale;
}>) {
  if (items.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptyAssignedEmployees}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <UserCheck className="text-on-surface-variant size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              className="text-on-surface hover:text-secondary truncate text-sm font-semibold transition-colors"
              href={`/${locale}/admin/staff/${item.employeeId}`}
            >
              {item.employeeName}
            </Link>
            <p className="text-on-surface-variant text-xs">
              {formatDate(item.startDate, locale)}
              {" – "}
              {item.endDate ? formatDate(item.endDate, locale) : copy.statusActive}
            </p>
          </div>
          <span
            className={
              item.isActive
                ? "bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                : "bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            }
          >
            {item.isActive ? copy.statusActive : copy.statusInactive}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentPlansList({
  items,
  copy,
  locale,
}: Readonly<{
  items: readonly ClientRecentPlan[];
  copy: ClientDetailCopy;
  locale: Locale;
}>) {
  if (items.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptyRecentPlans}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <ClipboardList className="text-on-surface-variant size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              className="text-on-surface hover:text-secondary truncate text-sm font-semibold transition-colors"
              href={`/${locale}/admin/staff/${item.employeeId}`}
            >
              {item.employeeName}
            </Link>
            <p className="text-on-surface-variant text-xs">
              {formatDate(item.workDate, locale)}
              {" · "}
              {copy.planItemsCompleted(item.completedItems, item.totalItems)}
            </p>
          </div>
          <span
            className={
              item.status === "submitted"
                ? "bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                : "bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            }
          >
            {item.status === "submitted"
              ? copy.planStatusSubmitted
              : copy.planStatusInProgress}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionsTree({
  sections,
  copy,
}: Readonly<{
  sections: readonly ClientSectionSummary[];
  copy: ClientDetailCopy;
}>) {
  if (sections.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptySections}
      </p>
    );
  }

  // Build tree
  const rootSections = sections.filter((s) => !s.parentSectionId);
  const childrenMap = new Map<string, ClientSectionSummary[]>();
  sections.forEach((s) => {
    if (s.parentSectionId) {
      const existing = childrenMap.get(s.parentSectionId) ?? [];
      existing.push(s);
      childrenMap.set(s.parentSectionId, existing);
    }
  });

  function renderSection(
    section: ClientSectionSummary,
    depth: number,
  ): React.ReactNode {
    const children = childrenMap.get(section.id) ?? [];
    return (
      <div key={section.id}>
        <div
          className={[
            "border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3",
            depth > 0 ? "ml-6" : "",
          ].join(" ")}
          style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
        >
          <Layers className="text-on-surface-variant size-4 shrink-0" />
          <p className="text-on-surface min-w-0 flex-1 truncate text-sm font-semibold">
            {section.name}
          </p>
          {children.length > 0 && (
            <span className="bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
              {children.length}
            </span>
          )}
        </div>
        {children.map((child) => renderSection(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {rootSections.map((section) => renderSection(section, 0))}
    </div>
  );
}

export function ClientDetailInteractive({
  data,
  locale,
  copy,
}: ClientDetailInteractiveProps) {
  if (!data.client) {
    return null;
  }

  const { client } = data;

  return (
    <div className="grid gap-6">
      <div>
        <Link
          className="text-on-surface-variant hover:text-secondary inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          href={`/${locale}/admin?tab=clients`}
        >
          <ArrowLeft className="size-4" />
          {copy.backToClients}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-secondary/10 text-secondary flex size-14 shrink-0 items-center justify-center rounded-2xl">
          <Building2 className="size-7" />
        </div>
        <div>
          <h1 className="font-heading text-primary-container text-2xl font-bold">
            {client.name}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {client.address || "—"}
          </p>
        </div>
        <span
          className={[
            "ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold",
            client.isActive
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-surface-container text-on-surface-variant",
          ].join(" ")}
        >
          {client.isActive ? copy.statusActive : copy.statusInactive}
        </span>
      </div>

      {/* Profile */}
      <ProfileSection client={client} copy={copy} />

      {/* Sections */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <Layers className="size-5" />
          {copy.sectionsTitle}
        </h2>
        <SectionsTree copy={copy} sections={data.sections} />
      </section>

      {/* Assigned Employees */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <CalendarCheck className="size-5" />
          {copy.assignedEmployeesTitle}
        </h2>
        <AssignedEmployeesList
          copy={copy}
          items={data.assignedEmployees}
          locale={locale}
        />
      </section>

      {/* Recent Plans */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <ClipboardList className="size-5" />
          {copy.recentPlansTitle}
        </h2>
        <RecentPlansList
          copy={copy}
          items={data.recentPlans}
          locale={locale}
        />
      </section>
    </div>
  );
}
