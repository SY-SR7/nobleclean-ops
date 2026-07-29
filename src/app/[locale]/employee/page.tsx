import { notFound } from "next/navigation";

import { Button, MetricCard } from "@/components/ui";
import { MyDaySelectionForm } from "@/features/employee/my-day/MyDaySelectionForm";
import { getMyDayData, safeWorkDate } from "@/features/employee/my-day/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type EmployeePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    date?: string | string[];
  }>;
}>;

type MyDayCopy = Readonly<{
  allocatedHours: string;
  client: string;
  completionSaved: string;
  currentPlan: string;
  dateLabel: string;
  error: string;
  emptyItems: string;
  emptySchedule: string;
  itemDetails: string;
  itemListTitle: string;
  itemNotes: string;
  lastCleaned: string;
  lastPerformed: string;
  loadDate: string;
  loadError: string;
  mandatory: string;
  minutes: string;
  neverCleaned: string;
  neverPerformed: string;
  noPlan: string;
  noToolSteps: string;
  optional: string;
  plannedMinutes: string;
  quantity: string;
  recurrenceDays: string;
  markAllDone: string;
  readyToSave: string;
  remainingMinutes: string;
  saved: string;
  saveSelection: string;
  selectedItems: string;
  selectItem: string;
  section: string;
  submitCompletion: string;
  statusCritical: string;
  statusInProgress: string;
  statusMandatoryOverdue: string;
  statusRecent: string;
  statusSubmitted: string;
  statusWarning: string;
  tooShort: string;
  title: string;
  toolSteps: string;
}>;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageCopy(messages: ReturnType<typeof getMessages>): MyDayCopy {
  return {
    allocatedHours: t(messages, "myDay.allocatedHours"),
    client: t(messages, "myDay.client"),
    completionSaved: t(messages, "myDay.feedback.completionSaved"),
    currentPlan: t(messages, "myDay.currentPlan"),
    dateLabel: t(messages, "myDay.dateLabel"),
    error: t(messages, "myDay.feedback.error"),
    emptyItems: t(messages, "myDay.emptyItems"),
    emptySchedule: t(messages, "myDay.emptySchedule"),
    itemDetails: t(messages, "myDay.itemDetails"),
    itemListTitle: t(messages, "myDay.itemListTitle"),
    itemNotes: t(messages, "myDay.itemNotes"),
    lastCleaned: t(messages, "myDay.lastCleaned"),
    lastPerformed: t(messages, "myDay.lastPerformed"),
    loadDate: t(messages, "myDay.actions.loadDate"),
    loadError: t(messages, "myDay.feedback.loadError"),
    mandatory: t(messages, "myDay.mandatory"),
    minutes: t(messages, "myDay.minutes"),
    neverCleaned: t(messages, "myDay.neverCleaned"),
    neverPerformed: t(messages, "myDay.neverPerformed"),
    noPlan: t(messages, "myDay.noPlan"),
    noToolSteps: t(messages, "myDay.noToolSteps"),
    optional: t(messages, "myDay.optional"),
    plannedMinutes: t(messages, "myDay.plannedMinutes"),
    quantity: t(messages, "myDay.quantity"),
    recurrenceDays: t(messages, "sectionsItems.recurrenceDays"),
    markAllDone: t(messages, "actions.markAllDone"),
    readyToSave: t(messages, "myDay.readyToSave"),
    remainingMinutes: t(messages, "myDay.remainingMinutes"),
    saved: t(messages, "myDay.feedback.saved"),
    saveSelection: t(messages, "myDay.actions.saveSelection"),
    section: t(messages, "myDay.section"),
    selectedItems: t(messages, "myDay.selectedItems"),
    selectItem: t(messages, "myDay.actions.selectItem"),
    statusCritical: t(messages, "status.critical"),
    submitCompletion: t(messages, "myDay.actions.submitCompletion"),
    statusInProgress: t(messages, "status.inProgress"),
    statusMandatoryOverdue: t(messages, "myDay.statusMandatoryOverdue"),
    statusRecent: t(messages, "status.recent"),
    statusSubmitted: t(messages, "status.submitted"),
    statusWarning: t(messages, "status.warning"),
    tooShort: t(messages, "myDay.feedback.tooShort"),
    title: t(messages, "myDay.title"),
    toolSteps: t(messages, "myDay.toolSteps"),
  };
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export default async function EmployeePage({
  params,
  searchParams,
}: EmployeePageProps) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getMessages(locale);
  const copy = pageCopy(messages);
  const workDate = safeWorkDate(firstSearchValue(resolvedSearchParams.date));
  const data = await getMyDayData(locale, workDate);

  return (
    <section className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {copy.title}
        </h1>
        <p className="text-on-surface-variant text-sm">
          {formatDate(workDate, locale)}
        </p>
      </div>

      {!data.ok ? (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.loadError}
        </p>
      ) : null}

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <label
            className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
            htmlFor="my-day-date"
          >
            {copy.dateLabel}
          </label>
          <input
            className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
            defaultValue={workDate}
            id="my-day-date"
            name="date"
            type="date"
          />
        </div>
        <Button type="submit">{copy.loadDate}</Button>
      </form>

      {data.schedule ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label={copy.client} value={data.schedule.clientName} />
            <MetricCard
              label={copy.allocatedHours}
              value={data.schedule.allocatedHours}
            />
            <MetricCard
              label={copy.selectedItems}
              value={data.plan?.selectedItems ?? 0}
            />
          </div>

          <MyDaySelectionForm
            copy={copy}
            items={data.items}
            locale={locale}
            plan={data.plan}
            schedule={data.schedule}
          />
        </>
      ) : (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
          {copy.emptySchedule}
        </p>
      )}
    </section>
  );
}
