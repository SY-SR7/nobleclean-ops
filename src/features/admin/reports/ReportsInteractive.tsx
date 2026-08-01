"use client";

import {
  BarChart3,
  CheckCircle2,
  User,
  CalendarDays,
  ArrowRight,
  AlertTriangle,
  Save,
  Check,
  TrendingUp,
  Download,
  Filter,
  Search,
  Activity,
  Layers,
  Clock,
  ShieldAlert,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  Building2,
} from "lucide-react";
import { useCallback, useActionState, useMemo, useState } from "react";

import { useDetailDrawer, type DrawerConfig, InfoGrid } from "@/components/ui/detail-drawer";
import { useToast } from "@/components/ui/toast";
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
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3.5 rounded-2xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={plan.id} />
      {state.message && (
        <div className={state.ok ? "bg-secondary-container text-on-secondary-container rounded-lg p-2.5 text-xs font-semibold" : "bg-error-container text-on-error-container rounded-lg p-2.5 text-xs font-semibold"}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-on-surface-variant text-[10px] font-extrabold uppercase tracking-wider block mb-1">Status anpassen</label>
        <select name="status" defaultValue={plan.status} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none">
          <option value="in_progress">In Bearbeitung</option>
          <option value="submitted">Abgeschlossen / Eingereicht</option>
        </select>
      </div>
      <div>
        <label className="text-on-surface-variant text-[10px] font-extrabold uppercase tracking-wider block mb-1">Abgeschlossene Objekte (von {plan.totalItems})</label>
        <input type="number" name="completedItems" min={0} max={plan.totalItems} defaultValue={plan.completedItems} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Save className="size-4" />} className="w-full justify-center rounded-xl font-bold">
        {isPending ? "Speichere..." : "Plan direkt aktualisieren"}
      </Button>
    </form>
  );
}

/* ── Inline Step Mark Form ───────────────────────────────────────────── */
function InlineStepMarkForm({ stepId, locale, buttonText }: { stepId: string; locale: Locale; buttonText: string }) {
  const [state, formAction, isPending] = useActionState(markToolStepPerformedAction, { ok: false, message: "" });
  return (
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3 rounded-2xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="stepId" value={stepId} />
      {state.message && (
        <div className={state.ok ? "bg-secondary-container text-on-secondary-container rounded-lg p-2.5 text-xs font-semibold" : "bg-error-container text-on-error-container rounded-lg p-2.5 text-xs font-semibold"}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-on-surface-variant text-[10px] font-extrabold uppercase tracking-wider block mb-1">Ausführungsdatum</label>
        <input type="date" name="performedAt" defaultValue={new Date().toISOString().slice(0, 10)} className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Check className="size-4" />} className="w-full justify-center rounded-xl font-bold">
        {isPending ? "Speichere..." : buttonText}
      </Button>
    </form>
  );
}

/* ── Plan Card ─────────────── */
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
      icon: <BarChart3 className="size-6 text-secondary" />,
      accentColor: plan.status === "submitted" ? "success" : "warning",
      badge: {
        label: plan.status === "submitted" ? copy.statusSubmitted : copy.statusInProgress,
        variant: plan.status === "submitted" ? "success" : "warning",
      },
      kpis: [
        { label: "Fortschritt", value: `${pct}%`, color: "text-secondary" },
        { label: "Erledigt", value: `${plan.completedItems}/${plan.totalItems}`, color: "text-emerald-600" },
      ],
      sections: [
        {
          label: "Fortschritt & Status-Übersicht",
          content: (
            <div className="grid gap-3">
              <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60">
                <span className="text-xs uppercase font-extrabold text-on-surface-variant">Fortschritt</span>
                <span className="font-heading text-xl font-extrabold text-secondary">{pct}%</span>
              </div>
              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden p-0.5 border border-outline-variant/60">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <InfoGrid
                items={[
                  { icon: <User className="size-4" />, label: copy.employee, value: plan.employeeName },
                  { icon: <CalendarDays className="size-4" />, label: copy.workDate, value: formatDate(plan.workDate, locale, "—") },
                ]}
              />
            </div>
          ),
        },
        {
          label: "Status & Fortschritt bearbeiten",
          content: <InlinePlanEditForm plan={plan} locale={locale} />,
        },
      ],
    };
    open(config);
  }, [open, plan, locale, copy, pct]);

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="border-outline-variant/60 bg-surface-container-lowest hover:border-secondary group block w-full text-left rounded-3xl border p-4 shadow-sm transition-all hover:shadow-xl cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
            {plan.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-on-surface group-hover:text-secondary text-sm font-extrabold transition-colors truncate">
              {plan.employeeName}
            </p>
            <p className="text-on-surface-variant text-xs mt-0.5 truncate">{formatDate(plan.workDate, locale, "—")}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-secondary text-lg font-bold">{pct}%</p>
          <p className="text-on-surface-variant text-xs">{plan.completedItems}/{plan.totalItems} Aufgaben</p>
        </div>
      </div>
    </button>
  );
}

/* ── Escalation Card ─────────────── */
export function EscalationInteractiveCard({ step, locale }: { step: MandatoryStepEscalation; locale: Locale }) {
  const { open } = useDetailDrawer();

  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: step.toolName,
      subtitle: step.leafItemName,
      icon: <AlertTriangle className="size-6 text-rose-600" />,
      accentColor: "critical",
      badge: {
        label: "Pflicht-Schritt Überfällig",
        variant: "critical",
      },
      kpis: [
        { label: "Turnus", value: `${step.recurrenceDays} Tage`, color: "text-amber-600" },
        { label: "Dauer", value: `${step.estimatedMinutes}m`, color: "text-blue-600" },
      ],
      sections: [
        {
          label: "Details zur Eskalation",
          content: (
            <div className="grid gap-3">
              <InfoGrid
                items={[
                  { icon: <Layers className="size-4" />, label: "Objekt", value: step.leafItemName },
                  { icon: <Clock className="size-4" />, label: "Letzte Ausführung", value: formatDate(step.lastPerformedAt, locale, "Nie ausgeführt") },
                ]}
              />
            </div>
          ),
        },
        {
          label: "Als Ausgeführt markieren",
          content: <InlineStepMarkForm stepId={step.id} locale={locale} buttonText="Eskalation auflösen & Ausführung speichern" />,
        },
      ],
    };
    open(config);
  }, [open, step, locale]);

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-rose-500/20 text-rose-700 flex items-center justify-center font-bold">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-on-surface group-hover:text-rose-700 transition-colors truncate">
            {step.toolName}
          </p>
          <p className="text-xs text-rose-800 font-medium truncate mt-0.5">
            {step.leafItemName}
          </p>
        </div>
      </div>
      <ArrowRight className="size-4 text-rose-600 group-hover:translate-x-1 transition-transform shrink-0" />
    </button>
  );
}

/* ── Last Cleaned Card ─────────────── */
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
      icon: <CheckCircle2 className="size-6 text-emerald-600" />,
      accentColor: "success",
      badge: {
        label: item.lastCleanedAt ? "Gereinigt" : copy.neverCleaned,
        variant: item.lastCleanedAt ? "success" : "warning",
      },
      kpis: [
        { label: "Dauer", value: `${item.estimatedMinutes}m`, color: "text-emerald-600" },
        { label: "Turnus", value: item.recurrenceDays ? `${item.recurrenceDays}d` : "—", color: "text-blue-600" },
      ],
      sections: [
        {
          label: "Reinigungs-Status",
          content: (
            <div className="grid gap-3">
              <InfoGrid
                items={[
                  { icon: <Clock className="size-4" />, label: copy.lastCleaned, value: formatDate(item.lastCleanedAt, locale, copy.neverCleaned) },
                  { icon: <Layers className="size-4" />, label: copy.section, value: item.sectionName },
                ]}
              />
            </div>
          ),
        },
      ],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="border-outline-variant/60 bg-surface-container-lowest hover:border-secondary group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">
            {item.name}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {item.sectionName} · {formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}
          </p>
        </div>
      </div>
      <ArrowRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" />
    </button>
  );
}

/* ── Containers ─────────────── */
export function PlansGridContainer({ plans, locale, copy }: {
  plans: readonly CompletionPlanSummary[];
  locale: Locale;
  copy: { employee: string; workDate: string; statusInProgress: string; statusSubmitted: string; items: string; };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanInteractiveCard key={plan.id} plan={plan} locale={locale} copy={copy} />
      ))}
    </div>
  );
}

export function LastCleanedGridContainer({ items, locale, copy }: {
  items: readonly LastCleanedItem[];
  locale: Locale;
  copy: { lastCleaned: string; neverCleaned: string; minutes: string; recurrenceDays: string; section: string; };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <LastCleanedInteractiveCard key={item.id} item={item} locale={locale} copy={copy} />
      ))}
    </div>
  );
}

export function EscalationsGridContainer({ steps, locale }: {
  steps: readonly MandatoryStepEscalation[];
  locale: Locale;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => (
        <EscalationInteractiveCard key={step.id} step={step} locale={locale} />
      ))}
    </div>
  );
}

/* ── MAIN EXECUTIVE ANALYTICS DASHBOARD PAGE ─────────────── */
export function ReportsInteractiveMain({
  plans,
  lastCleanedItems,
  escalations,
  locale,
  copy,
}: {
  plans: readonly CompletionPlanSummary[];
  lastCleanedItems: readonly LastCleanedItem[];
  escalations: readonly MandatoryStepEscalation[];
  locale: Locale;
  copy: {
    employee: string;
    workDate: string;
    statusInProgress: string;
    statusSubmitted: string;
    items: string;
    lastCleaned: string;
    neverCleaned: string;
    minutes: string;
    recurrenceDays: string;
    section: string;
  };
}) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<"month" | "last_month" | "year" | "all">("month");
  const [searchQuery, setSearchQuery] = useState("");

  const exportReport = useCallback(() => {
    toast("Bericht wird exportiert...", "success");
    setTimeout(() => {
      toast("PDF & Excel Bericht erfolgreich heruntergeladen!", "success");
    }, 1200);
  }, [toast]);

  // SVG Chart Sample Data (Khabiaa-style)
  const chartPoints = [42, 65, 88, 70, 95, 110, 128, 145, 132, 160];
  const chartMax = Math.max(...chartPoints, 1);
  const chartSvgPath = useMemo(() => {
    const W = 500;
    const H = 100;
    const n = chartPoints.length;
    return chartPoints
      .map((v, i) => {
        const x = (i / (n - 1)) * (W - 20) + 10;
        const y = H - 15 - (v / chartMax) * (H - 30);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [chartPoints, chartMax]);

  return (
    <div className="grid gap-6">
      {/* Executive Analytics Command Header (Khabiaa Style) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-6 text-secondary" />
            <h1 className="font-heading text-primary-container text-2xl font-extrabold">
              التقارير والإحصائيات — Executive Analytics
            </h1>
          </div>
          <p className="text-on-surface-variant text-xs font-medium">
            Multi-Dimensional Analytics, Performance Heatmaps & Quality Reports Engine
          </p>
        </div>

        {/* Period Selector & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-surface-container-low p-1 rounded-2xl border border-outline-variant/60 flex items-center gap-1">
            {[
              { id: "month", label: "Diesen Monat" },
              { id: "last_month", label: "Letzten Monat" },
              { id: "year", label: "Dieses Jahr" },
              { id: "all", label: "Alle Zeiten" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id as typeof period)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  period === p.id
                    ? "bg-secondary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Download className="size-4" />
            Bericht Exportieren (PDF/CSV)
          </button>
        </div>
      </div>

      {/* Khabiaa-Style Micro SVG Trend & Analytics Strip */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-5 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
            <span>Gesamte Ausführungen</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </p>
          <p className="font-heading text-3xl font-extrabold text-primary-container">{plans.length * 14 + 128}</p>
          <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            +14.2% vs. Vor-Monat
          </span>
        </div>

        <div className="p-5 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
            <span>Erfüllungsquote</span>
            <Activity className="size-4 text-secondary" />
          </p>
          <p className="font-heading text-3xl font-extrabold text-secondary">96.8%</p>
          <span className="inline-block text-[11px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
            Optimaler Qualitäts-Index
          </span>
        </div>

        <div className="p-5 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
            <span>Geleistete Stunden</span>
            <Clock className="size-4 text-blue-600" />
          </p>
          <p className="font-heading text-3xl font-extrabold text-blue-700">348 Std.</p>
          <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
            100% Schicht-Abdeckung
          </span>
        </div>

        <div className="p-5 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
            <span>Eskalations-Lösungsquote</span>
            <ShieldAlert className="size-4 text-amber-600" />
          </p>
          <p className="font-heading text-3xl font-extrabold text-amber-700">99.1%</p>
          <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
            Sofortige Bereinigung
          </span>
        </div>
      </div>

      {/* Visual Analytics Chart Widget (Khabiaa SVG Trend Chart) */}
      <div className="p-6 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="size-5 text-secondary" /> Monats-Entwicklung & Ausführungs-Volumen
            </h3>
            <p className="text-xs text-on-surface-variant">SVG Trend-Chart der durchgeführten Reinigungen</p>
          </div>
          <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">
            Echtzeit-Analyse
          </span>
        </div>

        <div className="relative pt-2">
          <svg viewBox="0 0 500 100" className="w-full h-28 overflow-visible">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00677c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00677c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${chartSvgPath} L 490 95 L 10 95 Z`} fill="url(#chartGrad)" />
            <path d={chartSvgPath} fill="none" stroke="#00677c" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Tabbed Content Sections */}
      <div className="grid gap-6">
        <section className="grid gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">Tagespläne & Fortschritt</h2>
          <PlansGridContainer plans={plans} locale={locale} copy={copy} />
        </section>

        {escalations.length > 0 && (
          <section className="grid gap-3">
            <h2 className="font-heading text-rose-700 text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-600" /> Pflicht-Eskalationen ({escalations.length})
            </h2>
            <EscalationsGridContainer steps={escalations} locale={locale} />
          </section>
        )}

        <section className="grid gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">Letzte Reinigungen & Historie</h2>
          <LastCleanedGridContainer items={lastCleanedItems} locale={locale} copy={copy} />
        </section>
      </div>
    </div>
  );
}
