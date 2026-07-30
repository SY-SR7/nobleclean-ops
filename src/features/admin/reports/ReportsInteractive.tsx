"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  User,
  CalendarDays,
  ArrowRight,
  AlertTriangle,
  Wrench,
  XCircle,
} from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import type {
  CompletionPlanSummary,
  LastCleanedItem,
  MandatoryStepEscalation,
} from "./queries";
import type { Locale } from "@/i18n/routing";

function formatDate(value: string | null, locale: Locale, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

/* ── Plan Card ─────────────────────────────────────────────────────────── */
export function PlanInteractiveCard({
  plan,
  locale,
  copy,
}: {
  plan: CompletionPlanSummary;
  locale: Locale;
  copy: {
    employee: string;
    workDate: string;
    statusInProgress: string;
    statusSubmitted: string;
    items: string;
  };
}) {
  const { open } = useDetailDrawer();
  const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;

  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: plan.employeeName,
      subtitle: formatDate(plan.workDate, locale, ""),
      icon: <BarChart3 className="size-5" />,
      accentColor: plan.isComplete ? "success" : "warning",
      sections: [
        {
          label: "Plan Status",
          content: (
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                {plan.isComplete ? (
                  <CheckCircle2 className="text-status-success size-5 shrink-0" />
                ) : (
                  <XCircle className="text-status-warning size-5 shrink-0" />
                )}
                <span className="text-on-surface text-sm font-semibold">
                  {plan.status === "submitted" ? copy.statusSubmitted : copy.statusInProgress}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-secondary size-4 shrink-0" />
                <div>
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.employee}
                  </p>
                  <p className="text-on-surface text-sm">{plan.employeeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="text-secondary size-4 shrink-0" />
                <div>
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.workDate}
                  </p>
                  <p className="text-on-surface text-sm">
                    {formatDate(plan.workDate, locale, "")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-on-surface-variant mb-1.5 text-xs font-semibold uppercase tracking-wide">
                  {copy.items}
                </p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-on-surface text-sm">
                    {plan.completedItems} / {plan.totalItems}
                  </span>
                  <span className="text-secondary text-sm font-bold">{pct}%</span>
                </div>
                <div className="bg-surface-container h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      pct === 100 ? "bg-status-success" : "bg-secondary",
                    ].join(" ")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          ),
        },
      ],
    };
    open(config);
  }, [open, plan, locale, pct, copy]);

  return (
    <button
      className="border-outline-variant bg-surface-container-lowest group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-secondary hover:shadow-sm"
      onClick={openDrawer}
      type="button"
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs",
          plan.isComplete
            ? "bg-status-success/10 text-status-success"
            : "bg-status-warning/10 text-status-warning",
        ].join(" ")}
      >
        {pct}%
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-on-surface group-hover:text-secondary text-sm font-semibold truncate transition-colors">
          {plan.employeeName}
        </p>
        <p className="text-on-surface-variant text-xs mt-0.5">
          {formatDate(plan.workDate, locale, "")} · {plan.completedItems}/{plan.totalItems}
        </p>
      </div>
      <ArrowRight className="text-on-surface-variant size-4 shrink-0" />
    </button>
  );
}

/* ── Last Cleaned Item ─────────────────────────────────────────────────── */
export function LastCleanedInteractiveCard({
  item,
  locale,
  copy,
}: {
  item: LastCleanedItem;
  locale: Locale;
  copy: {
    lastCleaned: string;
    neverCleaned: string;
    minutes: string;
    recurrenceDays: string;
    section: string;
  };
}) {
  const { open } = useDetailDrawer();

  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: item.name,
      subtitle: item.sectionName,
      icon: <CheckCircle2 className="size-5" />,
      accentColor:
        item.tag === "high_priority"
          ? "critical"
          : item.tag === "complaint"
            ? "warning"
            : "secondary",
      sections: [
        {
          label: "Reinigungsdetails",
          content: (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.minutes}
                  </p>
                  <p className="font-heading text-on-surface text-xl font-bold">
                    {item.estimatedMinutes}
                  </p>
                </div>
                {item.recurrenceDays && (
                  <div className="bg-surface-container rounded-lg p-3">
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.recurrenceDays}
                    </p>
                    <p className="font-heading text-on-surface text-xl font-bold">
                      {item.recurrenceDays}d
                    </p>
                  </div>
                )}
              </div>
              <div className="border-outline-variant rounded-lg border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                  {copy.lastCleaned}
                </p>
                <p className="text-on-surface text-sm mt-0.5">
                  {formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}
                </p>
              </div>
              <div className="border-outline-variant rounded-lg border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                  {copy.section}
                </p>
                <p className="text-on-surface text-sm mt-0.5">{item.sectionName}</p>
              </div>
            </div>
          ),
        },
      ],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button
      className="border-outline-variant bg-surface-container-lowest group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-secondary hover:shadow-sm"
      onClick={openDrawer}
      type="button"
    >
      <div className="min-w-0 flex-1">
        <p className="text-on-surface group-hover:text-secondary text-sm font-semibold truncate transition-colors">
          {item.name}
        </p>
        <p className="text-on-surface-variant text-xs mt-0.5">
          {item.sectionName} · {copy.lastCleaned}:{" "}
          {formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}
        </p>
      </div>
      <ArrowRight className="text-on-surface-variant size-4 shrink-0" />
    </button>
  );
}

/* ── Escalation Card ───────────────────────────────────────────────────── */
export function EscalationInteractiveCard({
  item,
  locale,
  copy,
}: {
  item: MandatoryStepEscalation;
  locale: Locale;
  copy: {
    lastPerformed: string;
    neverPerformed: string;
    minutes: string;
    recurrenceDays: string;
    mandatory: string;
  };
}) {
  const { open } = useDetailDrawer();

  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: item.toolName,
      subtitle: item.leafItemName,
      icon: <AlertTriangle className="size-5" />,
      accentColor: "critical",
      sections: [
        {
          label: "Eskalation",
          content: (
            <div className="grid gap-3">
              <div className="bg-error-container text-on-error-container rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                {copy.mandatory} — Überfällig
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.minutes}
                  </p>
                  <p className="font-heading text-on-surface text-xl font-bold">
                    {item.estimatedMinutes}
                  </p>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.recurrenceDays}
                  </p>
                  <p className="font-heading text-on-surface text-xl font-bold">
                    {item.recurrenceDays}d
                  </p>
                </div>
              </div>
              <div className="border-outline-variant rounded-lg border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                  Aufgabe
                </p>
                <p className="text-on-surface text-sm mt-0.5">{item.leafItemName}</p>
              </div>
              <div className="border-outline-variant rounded-lg border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                  {copy.lastPerformed}
                </p>
                <p className="text-on-surface text-sm mt-0.5">
                  {formatDate(item.lastPerformedAt, locale, copy.neverPerformed)}
                </p>
              </div>
            </div>
          ),
        },
      ],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button
      className="group flex w-full items-center gap-3 rounded-lg border border-error/30 bg-error-container/30 p-3 text-left transition-all hover:border-error hover:bg-error-container/50"
      onClick={openDrawer}
      type="button"
    >
      <AlertTriangle className="text-on-error-container size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-on-error-container text-sm font-semibold truncate">{item.toolName}</p>
        <p className="text-on-error-container/70 text-xs mt-0.5">
          {item.leafItemName} · {copy.lastPerformed}:{" "}
          {formatDate(item.lastPerformedAt, locale, copy.neverPerformed)}
        </p>
      </div>
      <ArrowRight className="text-on-error-container size-4 shrink-0" />
    </button>
  );
}
