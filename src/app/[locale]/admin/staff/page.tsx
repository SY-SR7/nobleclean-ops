import { notFound } from "next/navigation";

import { MetricCard, PriorityStatusBadge } from "@/components/ui";
import {
  EndAssignmentForm,
  StaffAssignmentForm,
  type StaffAssignmentCopy,
} from "@/features/admin/staff/StaffAssignmentForms";
import {
  getStaffAssignmentsData,
  type StaffAssignmentListItem,
  type StaffClientOption,
  type StaffEmployeeOption,
} from "@/features/admin/staff/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminStaffPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

type StaffPageCopy = Readonly<{
  activeAssignments: string;
  assignmentsTitle: string;
  clients: string;
  edit: string;
  employees: string;
  emptyAssignments: string;
  inactive: string;
  loadError: string;
  statusActive: string;
  statusInactive: string;
  title: string;
}>;

function assignmentCopy(
  messages: ReturnType<typeof getMessages>,
): StaffAssignmentCopy {
  return {
    activeEnded: t(messages, "staff.feedback.ended"),
    assignTitle: t(messages, "staff.assignTitle"),
    clientLabel: t(messages, "staff.fields.client"),
    employeeLabel: t(messages, "staff.fields.employee"),
    endAction: t(messages, "staff.actions.endAssignment"),
    endDateLabel: t(messages, "staff.fields.endDate"),
    error: t(messages, "staff.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    inactiveClient: t(messages, "adminClients.status.inactive"),
    save: t(messages, "actions.save"),
    saved: t(messages, "staff.feedback.saved"),
    startDateLabel: t(messages, "staff.fields.startDate"),
    updateTitle: t(messages, "staff.updateTitle"),
  };
}

function pageCopy(messages: ReturnType<typeof getMessages>): StaffPageCopy {
  return {
    activeAssignments: t(messages, "staff.activeAssignments"),
    assignmentsTitle: t(messages, "staff.assignmentsTitle"),
    clients: t(messages, "navigation.admin.clients"),
    edit: t(messages, "actions.edit"),
    employees: t(messages, "staff.employees"),
    emptyAssignments: t(messages, "staff.emptyAssignments"),
    inactive: t(messages, "adminClients.status.inactive"),
    loadError: t(messages, "staff.feedback.loadError"),
    statusActive: t(messages, "staff.status.active"),
    statusInactive: t(messages, "staff.status.inactive"),
    title: t(messages, "navigation.admin.staff"),
  };
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function AssignmentCard({
  assignment,
  clients,
  copy,
  employees,
  formCopy,
  locale,
}: Readonly<{
  assignment: StaffAssignmentListItem;
  clients: readonly StaffClientOption[];
  copy: StaffPageCopy;
  employees: readonly StaffEmployeeOption[];
  formCopy: StaffAssignmentCopy;
  locale: Locale;
}>) {
  return (
    <article className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-primary-container text-xl font-bold">
              {assignment.employeeName}
            </h2>
            <PriorityStatusBadge
              label={
                assignment.isActive ? copy.statusActive : copy.statusInactive
              }
              tone={assignment.isActive ? "success" : "recent"}
            />
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {formCopy.clientLabel}
              </dt>
              <dd className="text-on-surface text-sm">
                {assignment.clientName}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {formCopy.startDateLabel}
              </dt>
              <dd className="text-on-surface text-sm">
                {formatDate(assignment.startDate, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {formCopy.endDateLabel}
              </dt>
              <dd className="text-on-surface text-sm">
                {assignment.endDate
                  ? formatDate(assignment.endDate, locale)
                  : ""}
              </dd>
            </div>
          </dl>
        </div>
        {assignment.isActive ? (
          <EndAssignmentForm
            assignmentId={assignment.id}
            copy={formCopy}
            locale={locale}
          />
        ) : null}
      </div>

      <details className="border-outline-variant border-t pt-4">
        <summary className="text-primary-container cursor-pointer text-sm font-bold tracking-normal uppercase">
          {copy.edit}
        </summary>
        <div className="mt-4">
          <StaffAssignmentForm
            assignment={assignment}
            clients={clients}
            copy={formCopy}
            employees={employees}
            locale={locale}
            mode="update"
          />
        </div>
      </details>
    </article>
  );
}

export default async function AdminStaffPage({ params }: AdminStaffPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getMessages(locale);
  const copy = pageCopy(messages);
  const formCopy = assignmentCopy(messages);
  const data = await getStaffAssignmentsData(locale);
  const activeAssignments = data.assignments.filter(
    (assignment) => assignment.isActive,
  ).length;

  return (
    <section className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">
        {copy.title}
      </h1>

      {!data.ok ? (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.loadError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label={copy.employees} value={data.employees.length} />
        <MetricCard label={copy.clients} value={data.clients.length} />
        <MetricCard
          label={copy.activeAssignments}
          statusTone={activeAssignments > 0 ? "success" : "recent"}
          value={activeAssignments}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <StaffAssignmentForm
            clients={data.clients}
            copy={formCopy}
            employees={data.employees}
            locale={locale}
            mode="create"
          />
        </aside>

        <section className="grid gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">
            {copy.assignmentsTitle}
          </h2>
          {data.assignments.length > 0 ? (
            <div className="grid gap-3">
              {data.assignments.map((assignment) => (
                <AssignmentCard
                  assignment={assignment}
                  clients={data.clients}
                  copy={copy}
                  employees={data.employees}
                  formCopy={formCopy}
                  key={assignment.id}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
              {copy.emptyAssignments}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
