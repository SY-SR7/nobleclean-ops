"use client";

import { ArrowRight, Building2, Users, Layers, CalendarDays, BarChart3 } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { MetricCard } from "@/components/ui";
import { useAdminSpa, type AdminTab } from "@/context/admin-spa-context";
import type { AdminHomeData } from "./queries";
import type { Locale } from "@/i18n/routing";

type HomeInteractiveProps = Readonly<{
  data: AdminHomeData;
  locale: Locale;
  copy: {
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
    mandatoryEscalations: string;
    openPlans: string;
    recentWork: string;
    sectionAttention: string;
    sectionWorkflows: string;
    subtitle: string;
    title: string;
    todaySchedule: string;
    totalItems: string;
    viewClients: string;
    viewReports: string;
    workflowClients: string;
    workflowReports: string;
    workflowSchedule: string;
    workflowSectionsItems: string;
    workflowStaff: string;
  };
}>;

function formatHours(hours: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(hours);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export function HomeInteractive({ data, locale, copy }: HomeInteractiveProps) {
  const { setActiveTab } = useAdminSpa();
  const { open } = useDetailDrawer();

  const openPlanDrawer = useCallback(
    (plan: (typeof data.recentPlans)[number]) => {
      const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
      const isSubmitted = plan.status === "submitted";
      const config: DrawerConfig = {
        title: plan.employeeName,
        subtitle: `${plan.clientName} · ${formatDate(plan.workDate, locale)}`,
        icon: <BarChart3 className="size-5" />,
        accentColor: isSubmitted ? "success" : "warning",
        sections: [
          {
            label: "Details",
            content: (
              <div className="grid gap-3">
                <div className="flex justify-between items-center bg-surface-container p-3 rounded-lg">
                  <span className="text-xs uppercase font-bold text-on-surface-variant">Fortschritt</span>
                  <span className="font-heading text-xl font-bold text-secondary">{pct}%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container p-3 rounded-lg">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">{copy.employee}</span>
                    <p className="text-sm font-semibold mt-0.5">{plan.employeeName}</p>
                  </div>
                  <div className="bg-surface-container p-3 rounded-lg">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">{copy.client}</span>
                    <p className="text-sm font-semibold mt-0.5">{plan.clientName}</p>
                  </div>
                </div>
              </div>
            ),
          },
        ],
        footer: (
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className="w-full bg-secondary text-on-secondary py-2.5 rounded-lg font-semibold flex items-center justify-between px-4 text-sm"
          >
            <span>{copy.viewReports}</span>
            <ArrowRight className="size-4" />
          </button>
        ),
      };
      open(config);
    },
    [open, locale, copy, setActiveTab],
  );

  const workflows: { id: AdminTab; label: string; description: string; icon: React.ReactNode }[] = [
    { id: "clients", label: copy.activeClients, description: copy.workflowClients, icon: <Building2 className="size-5 text-secondary" /> },
    { id: "staff", label: copy.activeAssignments, description: copy.workflowStaff, icon: <Users className="size-5 text-secondary" /> },
    { id: "sections", label: copy.dueItems, description: copy.workflowSectionsItems, icon: <Layers className="size-5 text-secondary" /> },
    { id: "schedule", label: copy.todaySchedule, description: copy.workflowSchedule, icon: <CalendarDays className="size-5 text-secondary" /> },
    { id: "reports", label: copy.viewReports, description: copy.workflowReports, icon: <BarChart3 className="size-5 text-secondary" /> },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-primary-container text-2xl font-bold">{copy.title}</h1>
        <p className="text-on-surface-variant max-w-3xl text-sm">{copy.subtitle}</p>
      </div>

      {/* Interactive Metric Cards — Click switches tab instantly without URL change */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: copy.activeClients, value: data.activeClientCount, meta: copy.viewClients, tab: "clients" as AdminTab },
          { label: copy.activeAssignments, value: data.activeAssignmentCount, meta: `${data.employeeCount} ${copy.employees}`, tab: "staff" as AdminTab },
          { label: copy.todaySchedule, value: data.todayScheduleCount, meta: `${formatHours(data.todayAllocatedHours, locale)} ${copy.hours}`, tone: data.todayScheduleCount > 0 ? "success" : "warning", tab: "schedule" as AdminTab },
          { label: copy.dueItems, value: data.dueItemCount, meta: `${data.totalLeafItemCount} ${copy.totalItems}`, tone: data.dueItemCount > 0 ? "warning" : "recent", tab: "sections" as AdminTab },
          { label: copy.attentionItems, value: data.attentionItemCount, meta: `${data.highPriorityItemCount} ${copy.highPriority} / ${data.complaintItemCount} ${copy.complaint}`, tone: data.attentionItemCount > 0 ? "critical" : "recent", tab: "reports" as AdminTab },
          { label: copy.mandatoryEscalations, value: data.mandatoryStepEscalationCount, meta: copy.viewReports, tone: data.mandatoryStepEscalationCount > 0 ? "critical" : "recent", tab: "reports" as AdminTab },
        ].map((card) => (
          <button key={card.label} type="button" onClick={() => setActiveTab(card.tab)} className="block group text-left cursor-pointer">
            <MetricCard label={card.label} metadata={card.meta} statusTone={card.tone as never} value={card.value} />
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <section className="grid h-fit gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">{copy.recentWork}</h2>
          {data.recentPlans.length > 0 ? (
            <div className="grid gap-3">
              {data.recentPlans.map((plan) => {
                const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => openPlanDrawer(plan)}
                    className="border-outline-variant bg-surface-container-lowest group block w-full text-left rounded-lg border p-4 transition-all hover:border-secondary hover:shadow-sm cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-on-surface group-hover:text-secondary text-sm font-semibold transition-colors">{plan.employeeName}</p>
                        <p className="text-on-surface-variant text-xs">{plan.clientName} · {formatDate(plan.workDate, locale)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-heading text-secondary text-lg font-bold">{pct}%</p>
                        <p className="text-on-surface-variant text-xs">{plan.completedItems}/{plan.totalItems}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyRecent}</p>
          )}
        </section>

        <section className="grid h-fit gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">{copy.sectionAttention}</h2>
          {[
            { label: copy.mandatoryEscalations, value: data.mandatoryStepEscalationCount, tab: "reports" as AdminTab },
            { label: copy.openPlans, value: data.openPlanCount, tab: "reports" as AdminTab },
            { label: copy.dueItems, value: data.dueItemCount, tab: "sections" as AdminTab },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => setActiveTab(row.tab)}
              className="border-outline-variant bg-surface-container-lowest group flex w-full items-center justify-between rounded-lg border p-3 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
            >
              <span className="text-on-surface group-hover:text-secondary text-sm font-medium transition-colors">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-heading text-on-surface text-lg font-bold">{row.value}</span>
                <ArrowRight className="text-on-surface-variant size-4" />
              </div>
            </button>
          ))}
        </section>
      </div>

      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container text-xl font-bold">{copy.sectionWorkflows}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workflows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="border-outline-variant bg-surface-container-lowest group flex flex-col gap-2 rounded-lg border p-4 transition-all hover:border-secondary hover:shadow-md text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                {item.icon}
                <ArrowRight className="text-secondary size-4" />
              </div>
              <p className="text-on-surface group-hover:text-secondary text-sm font-bold transition-colors mt-1">{item.label}</p>
              <p className="text-on-surface-variant text-xs">{item.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
