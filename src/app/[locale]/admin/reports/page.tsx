import { notFound } from "next/navigation";

import {
  Button,
  MetricCard,
  PriorityStatusBadge,
  TaskItemCard,
  ToolStepCard,
} from "@/components/ui";
import {
  getReportsData,
  type CompletionPlanSummary,
  type LastCleanedItem,
  type MandatoryStepEscalation,
} from "@/features/admin/reports/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminReportsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    clientId?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
}>;

type ReportsCopy = Readonly<{
  clientLabel: string;
  completePlans: string;
  completionRate: string;
  dateFrom: string;
  dateTo: string;
  emptyClients: string;
  emptyIncomplete: string;
  emptyLastCleaned: string;
  employee: string;
  filter: string;
  incompletePlans: string;
  inactive: string;
  items: string;
  lastCleaned: string;
  lastPerformed: string;
  loadError: string;
  mandatory: string;
  mandatoryStepEscalations: string;
  minutes: string;
  neverCleaned: string;
  neverPerformed: string;
  emptyMandatoryStepEscalations: string;
  planCompletion: string;
  recurrenceDays: string;
  statusInProgress: string;
  statusSubmitted: string;
  title: string;
  totalPlans: string;
}>;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateFrom() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 14);
  return isoDate(date);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && isoDate(date) === value;
}

function safeDate(value: string, fallback: string) {
  return isIsoDate(value) ? value : fallback;
}

function reportsCopy(messages: ReturnType<typeof getMessages>): ReportsCopy {
  return {
    clientLabel: t(messages, "reports.clientLabel"),
    completePlans: t(messages, "reports.completePlans"),
    completionRate: t(messages, "reports.completionRate"),
    dateFrom: t(messages, "reports.dateFrom"),
    dateTo: t(messages, "reports.dateTo"),
    emptyClients: t(messages, "reports.emptyClients"),
    emptyIncomplete: t(messages, "reports.emptyIncomplete"),
    emptyLastCleaned: t(messages, "reports.emptyLastCleaned"),
    emptyMandatoryStepEscalations: t(
      messages,
      "reports.emptyMandatoryStepEscalations",
    ),
    employee: t(messages, "reports.employee"),
    filter: t(messages, "reports.actions.filter"),
    incompletePlans: t(messages, "reports.incompletePlans"),
    inactive: t(messages, "adminClients.status.inactive"),
    items: t(messages, "reports.items"),
    lastCleaned: t(messages, "reports.lastCleaned"),
    lastPerformed: t(messages, "reports.lastPerformed"),
    loadError: t(messages, "reports.feedback.loadError"),
    mandatory: t(messages, "reports.mandatory"),
    mandatoryStepEscalations: t(messages, "reports.mandatoryStepEscalations"),
    minutes: t(messages, "sectionsItems.minutes"),
    neverCleaned: t(messages, "reports.neverCleaned"),
    neverPerformed: t(messages, "reports.neverPerformed"),
    planCompletion: t(messages, "reports.planCompletion"),
    recurrenceDays: t(messages, "sectionsItems.recurrenceDays"),
    statusInProgress: t(messages, "status.inProgress"),
    statusSubmitted: t(messages, "status.submitted"),
    title: t(messages, "navigation.admin.reports"),
    totalPlans: t(messages, "reports.totalPlans"),
  };
}

function formatDate(value: string | null, locale: Locale, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function tagBadge(
  item: LastCleanedItem,
  messages: ReturnType<typeof getMessages>,
) {
  if (item.tag === "normal") {
    return null;
  }

  return item.tag === "complaint" ? (
    <PriorityStatusBadge
      label={t(messages, "sectionsItems.tags.complaint")}
      tone="warning"
    />
  ) : (
    <PriorityStatusBadge
      label={t(messages, "sectionsItems.tags.highPriority")}
      tone="critical"
    />
  );
}

function IncompletePlanCard({
  copy,
  locale,
  plan,
}: Readonly<{
  copy: ReportsCopy;
  locale: Locale;
  plan: CompletionPlanSummary;
}>) {
  return (
    <article className="border-outline-variant bg-surface-container-lowest grid gap-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-primary-container text-lg font-bold">
          {formatDate(plan.workDate, locale, plan.workDate)}
        </h3>
        <PriorityStatusBadge
          label={
            plan.status === "submitted"
              ? copy.statusSubmitted
              : copy.statusInProgress
          }
          tone={plan.status === "submitted" ? "recent" : "warning"}
        />
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
            {copy.planCompletion}
          </dt>
          <dd className="text-on-surface text-sm">
            {plan.completedItems} / {plan.totalItems}
          </dd>
        </div>
        <div>
          <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
            {copy.employee}
          </dt>
          <dd className="text-on-surface text-sm">{plan.employeeName}</dd>
        </div>
      </dl>
    </article>
  );
}

function LastCleanedCard({
  copy,
  item,
  locale,
  messages,
}: Readonly<{
  copy: ReportsCopy;
  item: LastCleanedItem;
  locale: Locale;
  messages: ReturnType<typeof getMessages>;
}>) {
  return (
    <TaskItemCard
      badge={tagBadge(item, messages)}
      estimatedMinutes={`${item.sectionName} · ${item.estimatedMinutes} ${copy.minutes}`}
      lastCleaned={`${copy.lastCleaned}: ${formatDate(
        item.lastCleanedAt,
        locale,
        copy.neverCleaned,
      )}`}
      title={item.name}
    />
  );
}

function MandatoryStepEscalationCard({
  copy,
  escalation,
  locale,
}: Readonly<{
  copy: ReportsCopy;
  escalation: MandatoryStepEscalation;
  locale: Locale;
}>) {
  return (
    <ToolStepCard
      duration={`${escalation.estimatedMinutes} ${copy.minutes}`}
      isMandatory
      mandatoryLabel={copy.mandatory}
      notes={
        <span>
          {copy.lastPerformed}:{" "}
          {formatDate(escalation.lastPerformedAt, locale, copy.neverPerformed)}
        </span>
      }
      optionalLabel=""
      recurrence={`${copy.recurrenceDays}: ${escalation.recurrenceDays}`}
      sequenceOrder={escalation.sequenceOrder}
      title={
        <span className="grid gap-1">
          <span>{escalation.toolName}</span>
          <span className="text-on-surface-variant text-sm font-normal">
            {escalation.leafItemName}
          </span>
        </span>
      }
    />
  );
}

export default async function AdminReportsPage({
  params,
  searchParams,
}: AdminReportsPageProps) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getMessages(locale);
  const copy = reportsCopy(messages);
  const today = isoDate(new Date());
  const from = safeDate(
    firstSearchValue(resolvedSearchParams.from),
    defaultDateFrom(),
  );
  const to = safeDate(firstSearchValue(resolvedSearchParams.to), today);
  const data = await getReportsData(
    locale,
    firstSearchValue(resolvedSearchParams.clientId),
    from <= to ? from : to,
    from <= to ? to : from,
  );
  const selectedClientId = data.selectedClientId;

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

      {data.clients.length === 0 ? (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
          {copy.emptyClients}
        </p>
      ) : null}

      {selectedClientId ? (
        <>
          <form className="grid gap-3 rounded sm:grid-cols-[minmax(14rem,20rem)_repeat(2,12rem)_auto] sm:items-end">
            <div className="grid gap-2">
              <label
                className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
                htmlFor="reports-client"
              >
                {copy.clientLabel}
              </label>
              <select
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
                defaultValue={selectedClientId}
                id="reports-client"
                name="clientId"
              >
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.isActive
                      ? client.name
                      : `${client.name} (${copy.inactive})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label
                className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
                htmlFor="reports-from"
              >
                {copy.dateFrom}
              </label>
              <input
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
                defaultValue={from}
                id="reports-from"
                name="from"
                type="date"
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
                htmlFor="reports-to"
              >
                {copy.dateTo}
              </label>
              <input
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
                defaultValue={to}
                id="reports-to"
                name="to"
                type="date"
              />
            </div>
            <Button type="submit">{copy.filter}</Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={copy.totalPlans} value={data.totalPlans} />
            <MetricCard
              label={copy.completePlans}
              statusTone="success"
              value={data.totalCompletePlans}
            />
            <MetricCard
              label={copy.incompletePlans}
              statusTone={data.totalIncompletePlans > 0 ? "warning" : "recent"}
              value={data.totalIncompletePlans}
            />
            <MetricCard
              label={copy.mandatoryStepEscalations}
              statusTone={
                data.mandatoryStepEscalations.length > 0 ? "critical" : "recent"
              }
              value={data.mandatoryStepEscalations.length}
            />
            <MetricCard
              label={copy.completionRate}
              metadata="%"
              statusTone={data.completionRate === 100 ? "success" : "warning"}
              value={data.completionRate}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {copy.mandatoryStepEscalations}
              </h2>
              {data.mandatoryStepEscalations.length > 0 ? (
                <div className="grid gap-3">
                  {data.mandatoryStepEscalations.map((escalation) => (
                    <MandatoryStepEscalationCard
                      copy={copy}
                      escalation={escalation}
                      key={escalation.id}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                  {copy.emptyMandatoryStepEscalations}
                </p>
              )}
            </section>

            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {copy.incompletePlans}
              </h2>
              {data.incompletePlans.length > 0 ? (
                <div className="grid gap-3">
                  {data.incompletePlans.map((plan) => (
                    <IncompletePlanCard
                      copy={copy}
                      key={plan.id}
                      locale={locale}
                      plan={plan}
                    />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                  {copy.emptyIncomplete}
                </p>
              )}
            </section>

            <section className="grid gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {copy.lastCleaned}
              </h2>
              {data.lastCleanedItems.length > 0 ? (
                <div className="grid gap-3">
                  {data.lastCleanedItems.map((item) => (
                    <LastCleanedCard
                      copy={copy}
                      item={item}
                      key={item.id}
                      locale={locale}
                      messages={messages}
                    />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                  {copy.emptyLastCleaned}
                </p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
