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
  Save,
  Check,
} from "lucide-react";
import { useCallback, useActionState } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { Button } from "@/components/ui";
import { updatePlanProgressAction, markToolStepPerformedAction } from "./actions";
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

/* ── Inline Plan Edit Form ───────────────────────────────────────────── */
function InlinePlanEditForm({ plan, locale }: { plan: CompletionPlanSummary; locale: Locale }) {
  const [state, formAction, isPending] = useActionState(updatePlanProgressAction, { ok: false, message: "" });
  return (
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3.5 rounded-xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={plan.id} />
      {state.message && (
        <div className={state.ok ? "bg-secondary-container text-on-secondary-container rounded-lg p-2.5 text-xs font-semibold" : "bg-error-container text-on-error-container rounded-lg p-2.5 text-xs font-semibold"}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider block mb-1">Status anpassen</label>
        <select name="status" defaultValue={plan.status} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-lg border px-3 text-sm outline-none">
          <option value="in_progress">In Bearbeitung</option>
          <option value="submitted">Abgeschlossen / Eingereicht</option>
        </select>
      </div>
      <div>
        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider block mb-1">Abgeschlossene Objekte (von {plan.totalItems})</label>
        <input type="number" name="completedItems" min={0} max={plan.totalItems} defaultValue={plan.completedItems} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-lg border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Save className="size-4" />} className="w-full justify-center">
        {isPending ? "Speichere..." : "Plan direkt aktualisieren"}
      </Button>
    </form>
  );
}

/* ── Inline Step Mark Form ───────────────────────────────────────────── */
function InlineStepMarkForm({ stepId, locale, buttonText }: { stepId: string; locale: Locale; buttonText: string }) {
  const [state, formAction, isPending] = useActionState(markToolStepPerformedAction, { ok: false, message: "" });
  return (
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3 rounded-xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="stepId" value={stepId} />
      {state.message && (
        <div className={state.ok ? "bg-secondary-container text-on-secondary-container rounded-lg p-2.5 text-xs font-semibold" : "bg-error-container text-on-error-container rounded-lg p-2.5 text-xs font-semibold"}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider block mb-1">Ausführungsdatum</label>
        <input type="date" name="performedAt" defaultValue={new Date().toISOString().slice(0, 10)} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-lg border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Check className="size-4" />} className="w-full justify-center">
        {isPending ? "Speichere..." : buttonText}
      </Button>
    </form>
  );
}

/* ── Plan Card (standalone, used by parent containers) ─────────────── */
export function PlanInteractiveCard({ plan, locale, copy }: {
  plan: CompletionPlanSummary;
  locale: Locale;
  copy: { employee: string; workDate: string; statusInProgress: string; statusSubmitted: string; items: string; };
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
                {plan.isComplete ? <CheckCircle2 className="text-status-success size-5 shrink-0" /> : <XCircle className="text-status-warning size-5 shrink-0" />}
                <span className="text-on-surface text-sm font-semibold">{plan.status === "submitted" ? copy.statusSubmitted : copy.statusInProgress}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-secondary size-4 shrink-0" />
                <div>
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.employee}</p>
                  <p className="text-on-surface text-sm font-medium">{plan.employeeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="text-secondary size-4 shrink-0" />
                <div>
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.workDate}</p>
                  <p className="text-on-surface text-sm font-medium">{formatDate(plan.workDate, locale, "")}</p>
                </div>
              </div>
              <div>
                <p className="text-on-surface-variant mb-1.5 text-xs font-semibold uppercase tracking-wide">{copy.items}</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-on-surface text-sm">{plan.completedItems} / {plan.totalItems}</span>
                  <span className="text-secondary text-sm font-bold">{pct}%</span>
                </div>
                <div className="bg-surface-container h-2.5 w-full overflow-hidden rounded-full">
                  <div className={["h-full rounded-full transition-all", pct === 100 ? "bg-status-success" : "bg-secondary"].join(" ")} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          ),
        },
        { label: "Direkte Bearbeitung", content: <InlinePlanEditForm plan={plan} locale={locale} /> },
      ],
    };
    open(config);
  }, [open, plan, locale, pct, copy]);

  return (
    <button
      className="border-outline-variant bg-surface-container-lowest group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-secondary hover:shadow-md cursor-pointer select-none"
      onClick={openDrawer}
      type="button"
    >
      <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm border", plan.isComplete ? "bg-status-success/10 text-status-success border-status-success/30" : "bg-status-warning/10 text-status-warning border-status-warning/30"].join(" ")}>
        {pct}%
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-on-surface group-hover:text-secondary text-sm font-semibold truncate transition-colors">{plan.employeeName}</p>
        <p className="text-on-surface-variant text-xs mt-0.5">{formatDate(plan.workDate, locale, "")} · {plan.completedItems}/{plan.totalItems}</p>
      </div>
      <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
    </button>
  );
}

/* ── Last Cleaned Item Card ─────────────────────────────────────────────── */
export function LastCleanedInteractiveCard({ item, locale, copy }: {
  item: LastCleanedItem;
  locale: Locale;
  copy: { lastCleaned: string; neverCleaned: string; minutes: string; recurrenceDays: string; section: string; };
}) {
  const { open } = useDetailDrawer();
  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: item.name,
      subtitle: item.sectionName,
      icon: <CheckCircle2 className="size-5" />,
      accentColor: item.tag === "high_priority" ? "critical" : item.tag === "complaint" ? "warning" : "secondary",
      sections: [
        {
          label: "Reinigungsdetails",
          content: (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.minutes}</p>
                  <p className="font-heading text-on-surface text-xl font-bold">{item.estimatedMinutes}m</p>
                </div>
                {item.recurrenceDays && (
                  <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60">
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.recurrenceDays}</p>
                    <p className="font-heading text-on-surface text-xl font-bold">{item.recurrenceDays}d</p>
                  </div>
                )}
              </div>
              <div className="border-outline-variant rounded-xl border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.lastCleaned}</p>
                <p className="text-on-surface text-sm mt-0.5 font-medium">{formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}</p>
              </div>
              <div className="border-outline-variant rounded-xl border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.section}</p>
                <p className="text-on-surface text-sm mt-0.5 font-medium">{item.sectionName}</p>
              </div>
            </div>
          ),
        },
        { label: "Direkte Bearbeitung", content: <InlineStepMarkForm stepId={item.id} locale={locale} buttonText="Jetzt als gereinigt markieren" /> },
      ],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button
      className="border-outline-variant bg-surface-container-lowest group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-secondary hover:shadow-md cursor-pointer select-none"
      onClick={openDrawer}
      type="button"
    >
      <div className="min-w-0 flex-1">
        <p className="text-on-surface group-hover:text-secondary text-sm font-semibold truncate transition-colors">{item.name}</p>
        <p className="text-on-surface-variant text-xs mt-0.5">{item.sectionName} · {copy.lastCleaned}: {formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}</p>
      </div>
      <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
    </button>
  );
}

/* ── Escalation Card ───────────────────────────────────────────────────── */
export function EscalationInteractiveCard({ item, locale, copy }: {
  item: MandatoryStepEscalation;
  locale: Locale;
  copy: { lastPerformed: string; neverPerformed: string; minutes: string; recurrenceDays: string; mandatory: string; };
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
          label: "Eskalationsdetails",
          content: (
            <div className="grid gap-3">
              <div className="bg-error-container text-on-error-container rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 border border-error/20">
                <AlertTriangle className="size-4 shrink-0" />
                {copy.mandatory} — Überfällig
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.minutes}</p>
                  <p className="font-heading text-on-surface text-xl font-bold">{item.estimatedMinutes}m</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.recurrenceDays}</p>
                  <p className="font-heading text-on-surface text-xl font-bold">{item.recurrenceDays}d</p>
                </div>
              </div>
              <div className="border-outline-variant rounded-xl border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">Aufgabe</p>
                <p className="text-on-surface text-sm mt-0.5 font-medium">{item.leafItemName}</p>
              </div>
              <div className="border-outline-variant rounded-xl border p-3">
                <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{copy.lastPerformed}</p>
                <p className="text-on-surface text-sm mt-0.5 font-medium">{formatDate(item.lastPerformedAt, locale, copy.neverPerformed)}</p>
              </div>
            </div>
          ),
        },
        { label: "Eskalation beheben", content: <InlineStepMarkForm stepId={item.id} locale={locale} buttonText="Pflichtschritt als erledigt markieren" /> },
      ],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button
      className="group flex w-full items-center gap-3 rounded-xl border border-error/30 bg-error-container/30 p-3.5 text-left transition-all hover:border-error hover:bg-error-container/50 cursor-pointer select-none"
      onClick={openDrawer}
      type="button"
    >
      <AlertTriangle className="text-on-error-container size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-on-error-container text-sm font-semibold truncate">{item.toolName}</p>
        <p className="text-on-error-container/70 text-xs mt-0.5">{item.leafItemName} · {copy.lastPerformed}: {formatDate(item.lastPerformedAt, locale, copy.neverPerformed)}</p>
      </div>
      <ArrowRight className="text-on-error-container size-4 shrink-0" />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* ── Plans Grid Container ────────────────────────────────────────────── */
export function PlansGridContainer({ plans, locale, copy }: {
  plans: readonly CompletionPlanSummary[];
  locale: Locale;
  copy: { employee: string; workDate: string; statusInProgress: string; statusSubmitted: string; items: string; };
}) {
  const [viewMode, setViewMode] = useViewMode("reports-plans", "grid");
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">{plans.length} Plan{plans.length !== 1 ? "e" : ""}</p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
            return (
              <PlanInteractiveCard key={plan.id} plan={plan} locale={locale} copy={copy} />
            );
          })}
        </div>
      ) : (
        <div className="grid gap-2">
          {plans.map((plan) => (
            <PlanInteractiveCard key={plan.id} plan={plan} locale={locale} copy={copy} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── LastCleaned Grid Container ──────────────────────────────────────── */
export function LastCleanedGridContainer({ items, locale, copy }: {
  items: readonly LastCleanedItem[];
  locale: Locale;
  copy: { lastCleaned: string; neverCleaned: string; minutes: string; recurrenceDays: string; section: string; };
}) {
  const [viewMode, setViewMode] = useViewMode("reports-cleaned", "grid");
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">{items.length} Element{items.length !== 1 ? "e" : ""}</p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:border-secondary hover:shadow-md">
              <div className="flex items-center justify-between bg-surface-container px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <CheckCircle2 className="size-6" />
                </div>
                {item.tag && item.tag !== "normal" && (
                  <span className={item.tag === "high_priority" ? "text-xs font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded-full" : "text-xs font-bold bg-warning-container text-on-warning-container px-2 py-0.5 rounded-full"}>
                    {item.tag === "high_priority" ? "⚠ Wichtig" : "⚠ Beschwerde"}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 gap-1.5 p-4">
                <LastCleanedInteractiveCard item={item} locale={locale} copy={copy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <LastCleanedInteractiveCard key={item.id} item={item} locale={locale} copy={copy} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Escalations Grid Container ──────────────────────────────────────── */
export function EscalationsGridContainer({ items, locale, copy }: {
  items: readonly MandatoryStepEscalation[];
  locale: Locale;
  copy: { lastPerformed: string; neverPerformed: string; minutes: string; recurrenceDays: string; mandatory: string; };
}) {
  const [viewMode, setViewMode] = useViewMode("reports-escalations", "grid");
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">{items.length} Eskalation{items.length !== 1 ? "en" : ""}</p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-error/30 bg-error-container/20 shadow-sm transition-all hover:border-error hover:shadow-md">
              <div className="flex items-center justify-between bg-error-container/30 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                  <AlertTriangle className="size-6" />
                </div>
                <span className="text-xs font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded-full border border-error/20">
                  Überfällig
                </span>
              </div>
              <div className="flex flex-col flex-1 gap-1.5 p-4">
                <EscalationInteractiveCard item={item} locale={locale} copy={copy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <EscalationInteractiveCard key={item.id} item={item} locale={locale} copy={copy} />
          ))}
        </div>
      )}
    </div>
  );
}
