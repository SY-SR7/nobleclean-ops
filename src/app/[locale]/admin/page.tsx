import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MetricCard, PriorityStatusBadge } from "@/components/ui";
import {
  getAdminHomeData,
  type RecentAdminPlan,
} from "@/features/admin/home/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

type AdminHomeCopy = Readonly<{
  activeAssignments: string;
  activeClients: string;
  attentionItems: string;
  client: string;
  complaint: string;
  dueItems: string;
  employee: string;
  employees: string;
  emptyRecent: string;
  highPriority: string;
  hours: string;
  items: string;
  loadError: string;
  mandatoryEscalations: string;
  openPlans: string;
  recentWork: string;
  sectionAttention: string;
  sectionWorkflows: string;
  statusInProgress: string;
  statusSubmitted: string;
  subtitle: string;
  todaySchedule: string;
  title: string;
  totalItems: string;
  viewClients: string;
  viewReports: string;
  workflowClients: string;
  workflowReports: string;
  workflowSchedule: string;
  workflowSectionsItems: string;
  workflowStaff: string;
}>;

type WorkflowItem = Readonly<{
  description: string;
  href: string;
  label: string;
}>;

function adminHomeCopy(
  messages: ReturnType<typeof getMessages>,
): AdminHomeCopy {
  return {
    activeAssignments: t(messages, "adminHome.metrics.activeAssignments"),
    activeClients: t(messages, "adminHome.metrics.activeClients"),
    attentionItems: t(messages, "adminHome.metrics.attentionItems"),
    client: t(messages, "adminHome.recent.client"),
    complaint: t(messages, "adminHome.metadata.complaint"),
    dueItems: t(messages, "adminHome.metrics.dueItems"),
    employee: t(messages, "adminHome.recent.employee"),
    employees: t(messages, "adminHome.metadata.employees"),
    emptyRecent: t(messages, "adminHome.emptyRecent"),
    highPriority: t(messages, "adminHome.metadata.highPriority"),
    hours: t(messages, "adminHome.metadata.hours"),
    items: t(messages, "adminHome.recent.items"),
    loadError: t(messages, "adminHome.feedback.loadError"),
    mandatoryEscalations: t(messages, "adminHome.metrics.mandatoryEscalations"),
    openPlans: t(messages, "adminHome.metrics.openPlans"),
    recentWork: t(messages, "adminHome.sections.recentWork"),
    sectionAttention: t(messages, "adminHome.sections.attention"),
    sectionWorkflows: t(messages, "adminHome.sections.workflows"),
    statusInProgress: t(messages, "status.inProgress"),
    statusSubmitted: t(messages, "status.submitted"),
    subtitle: t(messages, "adminHome.subtitle"),
    todaySchedule: t(messages, "adminHome.metrics.todaySchedule"),
    title: t(messages, "adminHome.title"),
    totalItems: t(messages, "adminHome.metadata.totalItems"),
    viewClients: t(messages, "adminHome.actions.viewClients"),
    viewReports: t(messages, "adminHome.actions.viewReports"),
    workflowClients: t(messages, "adminHome.workflows.clients"),
    workflowReports: t(messages, "adminHome.workflows.reports"),
    workflowSchedule: t(messages, "adminHome.workflows.schedule"),
    workflowSectionsItems: t(messages, "adminHome.workflows.sectionsItems"),
    workflowStaff: t(messages, "adminHome.workflows.staff"),
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

function formatHours(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(value);
}

function AttentionRow({
  actionLabel,
  href,
  label,
  tone,
  value,
}: Readonly<{
  actionLabel: string;
  href: string;
  label: string;
  tone: "critical" | "recent" | "warning";
  value: number;
}>) {
  return (
    <article className="border-outline-variant bg-surface-container-lowest grid gap-3 rounded border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-primary-container font-bold">{label}</h3>
          <p className="font-heading text-on-surface mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>
        <PriorityStatusBadge label={label} tone={tone} />
      </div>
      <Link
        className="text-secondary focus-visible:ring-secondary focus-visible:ring-offset-surface inline-flex w-fit items-center gap-2 rounded text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        href={href}
      >
        {actionLabel}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}

function WorkflowLink({ item }: Readonly<{ item: WorkflowItem }>) {
  return (
    <Link
      className="border-outline-variant bg-surface-container-lowest hover:bg-surface-accent focus-visible:ring-secondary focus-visible:ring-offset-surface grid min-w-0 gap-2 rounded border p-4 transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      href={item.href}
    >
      <span className="text-primary-container font-bold">{item.label}</span>
      <span className="text-on-surface-variant text-sm">
        {item.description}
      </span>
    </Link>
  );
}

function RecentPlanCard({
  copy,
  locale,
  plan,
}: Readonly<{
  copy: AdminHomeCopy;
  locale: Locale;
  plan: RecentAdminPlan;
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
          tone={plan.status === "submitted" ? "success" : "warning"}
        />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
            {copy.employee}
          </dt>
          <dd className="text-on-surface truncate text-sm">
            {plan.employeeName}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
            {copy.client}
          </dt>
          <dd className="text-on-surface truncate text-sm">
            {plan.clientName}
          </dd>
        </div>
        <div>
          <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
            {copy.items}
          </dt>
          <dd className="text-on-surface text-sm">
            {plan.completedItems} / {plan.totalItems}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireRole(locale, "admin");

  const messages = getMessages(locale);
  const copy = adminHomeCopy(messages);
  const data = await getAdminHomeData(locale);
  const workflows = [
    {
      description: copy.workflowClients,
      href: `/${locale}/admin/clients`,
      label: t(messages, "navigation.admin.clients"),
    },
    {
      description: copy.workflowStaff,
      href: `/${locale}/admin/staff`,
      label: t(messages, "navigation.admin.staff"),
    },
    {
      description: copy.workflowSectionsItems,
      href: `/${locale}/admin/sections-items`,
      label: t(messages, "navigation.admin.sectionsItems"),
    },
    {
      description: copy.workflowSchedule,
      href: `/${locale}/admin/schedule`,
      label: t(messages, "navigation.admin.schedule"),
    },
    {
      description: copy.workflowReports,
      href: `/${locale}/admin/reports`,
      label: t(messages, "navigation.admin.reports"),
    },
  ] satisfies readonly WorkflowItem[];

  return (
    <section className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {copy.title}
        </h1>
        <p className="text-on-surface-variant max-w-3xl text-sm">
          {copy.subtitle}
        </p>
      </div>

      {!data.ok ? (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.loadError}
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label={copy.activeClients}
              metadata={copy.viewClients}
              value={data.activeClientCount}
            />
            <MetricCard
              label={copy.activeAssignments}
              metadata={`${data.employeeCount} ${copy.employees}`}
              value={data.activeAssignmentCount}
            />
            <MetricCard
              label={copy.todaySchedule}
              metadata={`${formatHours(data.todayAllocatedHours, locale)} ${copy.hours}`}
              statusTone={data.todayScheduleCount > 0 ? "success" : "warning"}
              value={data.todayScheduleCount}
            />
            <MetricCard
              label={copy.dueItems}
              metadata={`${data.totalLeafItemCount} ${copy.totalItems}`}
              statusTone={data.dueItemCount > 0 ? "warning" : "recent"}
              value={data.dueItemCount}
            />
            <MetricCard
              label={copy.attentionItems}
              metadata={`${data.highPriorityItemCount} ${copy.highPriority} / ${data.complaintItemCount} ${copy.complaint}`}
              statusTone={data.attentionItemCount > 0 ? "critical" : "recent"}
              value={data.attentionItemCount}
            />
            <MetricCard
              label={copy.mandatoryEscalations}
              metadata={copy.viewReports}
              statusTone={
                data.mandatoryStepEscalationCount > 0 ? "critical" : "recent"
              }
              value={data.mandatoryStepEscalationCount}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {copy.recentWork}
              </h2>
              {data.recentPlans.length > 0 ? (
                <div className="grid gap-3">
                  {data.recentPlans.map((plan) => (
                    <RecentPlanCard
                      copy={copy}
                      key={plan.id}
                      locale={locale}
                      plan={plan}
                    />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                  {copy.emptyRecent}
                </p>
              )}
            </section>

            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {copy.sectionAttention}
              </h2>
              <AttentionRow
                actionLabel={copy.viewReports}
                href={`/${locale}/admin/reports`}
                label={copy.mandatoryEscalations}
                tone={
                  data.mandatoryStepEscalationCount > 0 ? "critical" : "recent"
                }
                value={data.mandatoryStepEscalationCount}
              />
              <AttentionRow
                actionLabel={copy.viewReports}
                href={`/${locale}/admin/reports`}
                label={copy.openPlans}
                tone={data.openPlanCount > 0 ? "warning" : "recent"}
                value={data.openPlanCount}
              />
              <AttentionRow
                actionLabel={copy.viewReports}
                href={`/${locale}/admin/reports`}
                label={copy.dueItems}
                tone={data.dueItemCount > 0 ? "warning" : "recent"}
                value={data.dueItemCount}
              />
            </section>
          </div>
        </>
      )}

      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container text-xl font-bold">
          {copy.sectionWorkflows}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workflows.map((item) => (
            <WorkflowLink item={item} key={item.href} />
          ))}
        </div>
      </section>
    </section>
  );
}
