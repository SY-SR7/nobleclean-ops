import { notFound } from "next/navigation";

import { Button, MetricCard } from "@/components/ui";
import {
  DeleteScheduleForm,
  ScheduleForm,
  type ScheduleCopy,
} from "@/features/admin/schedule/ScheduleForms";
import {
  getScheduleData,
  type ScheduleListItem,
} from "@/features/admin/schedule/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminSchedulePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    month?: string | string[];
  }>;
}>;

type SchedulePageCopy = Readonly<{
  allocatedHours: string;
  emptySchedules: string;
  entries: string;
  loadError: string;
  month: string;
  scheduledEmployees: string;
  schedulesTitle: string;
  selectMonth: string;
  title: string;
  workDate: string;
}>;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function safeMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function formCopy(messages: ReturnType<typeof getMessages>): ScheduleCopy {
  return {
    allocatedHoursLabel: t(messages, "schedule.fields.allocatedHours"),
    clientLabel: t(messages, "staff.fields.client"),
    createTitle: t(messages, "schedule.createTitle"),
    deleteAction: t(messages, "schedule.actions.delete"),
    deleted: t(messages, "schedule.feedback.deleted"),
    employeeLabel: t(messages, "staff.fields.employee"),
    error: t(messages, "schedule.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    inactiveClient: t(messages, "adminClients.status.inactive"),
    save: t(messages, "actions.save"),
    saved: t(messages, "schedule.feedback.saved"),
    updateTitle: t(messages, "schedule.updateTitle"),
    workDateLabel: t(messages, "schedule.fields.workDate"),
  };
}

function pageCopy(messages: ReturnType<typeof getMessages>): SchedulePageCopy {
  return {
    allocatedHours: t(messages, "schedule.allocatedHours"),
    emptySchedules: t(messages, "schedule.emptySchedules"),
    entries: t(messages, "schedule.entries"),
    loadError: t(messages, "schedule.feedback.loadError"),
    month: t(messages, "schedule.month"),
    scheduledEmployees: t(messages, "schedule.scheduledEmployees"),
    schedulesTitle: t(messages, "schedule.schedulesTitle"),
    selectMonth: t(messages, "schedule.actions.selectMonth"),
    title: t(messages, "navigation.admin.schedule"),
    workDate: t(messages, "schedule.fields.workDate"),
  };
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function ScheduleCard({
  copy,
  formCopy,
  locale,
  schedule,
  clients,
  employees,
}: Readonly<{
  clients: Parameters<typeof ScheduleForm>[0]["clients"];
  copy: SchedulePageCopy;
  employees: Parameters<typeof ScheduleForm>[0]["employees"];
  formCopy: ScheduleCopy;
  locale: Locale;
  schedule: ScheduleListItem;
}>) {
  return (
    <article className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded border p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-primary-container text-xl font-bold">
            {formatDate(schedule.workDate, locale)}
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {formCopy.employeeLabel}
              </dt>
              <dd className="text-on-surface text-sm">
                {schedule.employeeName}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {formCopy.clientLabel}
              </dt>
              <dd className="text-on-surface text-sm">{schedule.clientName}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
                {copy.allocatedHours}
              </dt>
              <dd className="text-on-surface text-sm">
                {schedule.allocatedHours}
              </dd>
            </div>
          </dl>
        </div>
        <DeleteScheduleForm
          copy={formCopy}
          locale={locale}
          scheduleId={schedule.id}
        />
      </div>

      <details className="border-outline-variant border-t pt-4">
        <summary className="text-primary-container cursor-pointer text-sm font-bold tracking-normal uppercase">
          {formCopy.updateTitle}
        </summary>
        <div className="mt-4">
          <ScheduleForm
            clients={clients}
            copy={formCopy}
            employees={employees}
            locale={locale}
            mode="update"
            schedule={schedule}
          />
        </div>
      </details>
    </article>
  );
}

export default async function AdminSchedulePage({
  params,
  searchParams,
}: AdminSchedulePageProps) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getMessages(locale);
  const copy = pageCopy(messages);
  const scheduleCopy = formCopy(messages);
  const month = safeMonth(firstSearchValue(resolvedSearchParams.month));
  const { from, to } = monthBounds(month);
  const data = await getScheduleData(locale, from, to);

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

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <label
            className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
            htmlFor="schedule-month"
          >
            {copy.month}
          </label>
          <input
            className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
            defaultValue={month}
            id="schedule-month"
            name="month"
            type="month"
          />
        </div>
        <Button type="submit">{copy.selectMonth}</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label={copy.entries} value={data.schedules.length} />
        <MetricCard
          label={copy.allocatedHours}
          value={data.totalAllocatedHours}
        />
        <MetricCard
          label={copy.scheduledEmployees}
          value={data.scheduledEmployeeCount}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <ScheduleForm
            clients={data.clients}
            copy={scheduleCopy}
            employees={data.employees}
            locale={locale}
            mode="create"
          />
        </aside>

        <section className="grid gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">
            {copy.schedulesTitle}
          </h2>
          {data.schedules.length > 0 ? (
            <div className="grid gap-3">
              {data.schedules.map((schedule) => (
                <ScheduleCard
                  clients={data.clients}
                  copy={copy}
                  employees={data.employees}
                  formCopy={scheduleCopy}
                  key={schedule.id}
                  locale={locale}
                  schedule={schedule}
                />
              ))}
            </div>
          ) : (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
              {copy.emptySchedules}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
