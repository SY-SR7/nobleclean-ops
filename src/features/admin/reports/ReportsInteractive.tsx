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
  TrendingDown,
  Download,
  Activity,
  Layers,
  Clock,
  ShieldAlert,
  Zap,
  PieChart,
  Users,
  Target,
  Award,
  Search,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { Printer } from "lucide-react";

import { useDetailDrawer, type DrawerConfig, InfoGrid } from "@/components/ui/detail-drawer";
import { Button } from "@/components/ui";
import { updatePlanProgressAction, markToolStepPerformedAction } from "./actions";
import type {
  CompletionPlanSummary,
  LastCleanedItem,
  MandatoryStepEscalation,
  ReportsClientOption,
} from "./queries";
import type { Locale } from "@/i18n/routing";

// ─────────────────────────────────────────────────────────────────────────────
// COPY TYPE
// ─────────────────────────────────────────────────────────────────────────────
export type AnalyticsCopy = {
  title: string; tabOverview: string; tabPlans: string; tabItems: string; tabStaff: string;
  periodMonth: string; periodYear: string; periodAll: string; allTime: string; yearLabel: string;
  kpiPlansTotal: string; kpiCompletionRate: string; kpiEscalations: string; kpiItemRate: string;
  chartEvolution: string; chartRateTrend: string; ratesTitle: string;
  plansCompleted: string; itemsCompleted: string; mandatoryCompleted: string;
  distributionTitle: string; insightsTitle: string; topStaffTitle: string;
  escalationsTitle: string; noEscalationsTitle: string; noEscalationsBody: string;
  completedLabel: string; openLabel: string; compareLastMonth: string; plansGrowth: string;
  chartLabelCompleted: string; chartLabelTotal: string; chartLabelRate: string;
  insightExcellent: string; insightLow: string; insightEscalations: string;
  insightTopStaff: string; insightOpenPlans: string;
  plansBadgeComplete: string; plansBadgeInProgress: string;
  drawerProgress: string; drawerCompleted: string; drawerStatusSection: string;
  drawerEditSection: string; drawerEmployee: string; drawerDate: string; drawerObject: string;
  drawerLastPerformed: string; drawerMarkDoneSection: string; drawerPerformedDate: string;
  drawerMarkDone: string; drawerSaving: string; drawerSave: string; drawerOverdueLabel: string;
  drawerTurnus: string; drawerDuration: string; drawerCleaned: string; drawerSection: string;
  searchPlaceholder: string; itemSearchPlaceholder: string; sortDate: string; sortCompletions: string;
  noPlans: string; noItems: string; noStaff: string;
  staffPlansCompleted: string; staffItemsDone: string; subLabelEmployee: string;
  exportCsv: string; filterAll: string; filterComplete: string; filterOpen: string;
  csvEmployee: string; csvDate: string; csvStatus: string; csvDone: string; csvTotal: string;
  csvProgress: string; statusComplete: string; statusInProgress: string;
};

export type ReportsMainCopy = {
  employee: string; workDate: string; statusInProgress: string; statusSubmitted: string;
  items: string; lastCleaned: string; neverCleaned: string; minutes: string;
  recurrenceDays: string; section: string;
  analytics: AnalyticsCopy;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtN = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 0 });

/** Simple template interpolation: "Hello {name}" + {name:"World"} → "Hello World" */
const interpolate = (tpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), tpl);

const monthShortDE = (locale: Locale, y: number, m: number) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { month: "short" }).format(new Date(y, m - 1, 1));

function formatDate(value: string | null, locale: Locale, fallback: string) {
  if (!value) return fallback;
  const d = new Date(value);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }).format(d);
}

type GrowthResult = { pct: number; up: boolean } | null;
function growthLabel(cur: number, prev: number): GrowthResult {
  if (prev <= 0) return null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

type ActiveSubTab = "overview" | "plans" | "items" | "staff";

// ─────────────────────────────────────────────────────────────────────────────
// COUNT-UP ANIMATION
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - startTime) / 700, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplay(Math.round(start + diff * eased));
      if (elapsed < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{fmtN(display)}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG LINE AREA CHART
// ─────────────────────────────────────────────────────────────────────────────
function LineAreaChart({
  dataA, dataB = [], labelA, labelB, labels, height = 110,
}: {
  dataA: number[]; dataB?: number[]; labelA: string; labelB?: string; labels: string[]; height?: number;
}) {
  const W = 500, H = height;
  const allVals = [...dataA, ...dataB];
  const maxV = Math.max(...allVals, 1);
  const n = dataA.length;
  const xOf = (i: number) => (i / Math.max(n - 1, 1)) * (W - 20) + 10;
  const yOf = (v: number) => H - 16 - (v / maxV) * (H - 30) + 4;
  const pathD = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const areaD = (data: number[]) =>
    `${pathD(data)} L ${xOf(n - 1).toFixed(1)} ${(H - 12).toFixed(1)} L ${xOf(0).toFixed(1)} ${(H - 12).toFixed(1)} Z`;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height }}>
        <defs>
          <linearGradient id="ncGradA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00677c" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00677c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ncGradB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1="10" x2={W - 10} y1={yOf(maxV * f)} y2={yOf(maxV * f)} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        <path d={areaD(dataA)} fill="url(#ncGradA)" />
        {dataB.some(v => v > 0) && <path d={areaD(dataB)} fill="url(#ncGradB)" />}
        <path d={pathD(dataA)} fill="none" stroke="#00677c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {dataB.some(v => v > 0) && (
          <path d={pathD(dataB)} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
        )}
        {dataA.map((v, i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={hover === i ? 6 : 3.5}
            fill="#00677c" stroke="white" strokeWidth="2"
            style={{ cursor: "pointer", transition: "r 0.15s" }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
        {hover !== null && (
          <g>
            <line x1={xOf(hover)} x2={xOf(hover)} y1="0" y2={H - 14} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 2" />
            <rect x={Math.min(xOf(hover) + 8, W - 80)} y={yOf(dataA[hover]) - 26} width="72" height="24" rx="6"
              fill="white" stroke="#e5e7eb" strokeWidth="1" />
            <text x={Math.min(xOf(hover) + 44, W - 44)} y={yOf(dataA[hover]) - 11} textAnchor="middle"
              fontSize="9" fill="#00677c" fontWeight="bold">{fmtN(dataA[hover])}</text>
          </g>
        )}
        {labels.map((l, i) => (
          <text key={i} x={xOf(i)} y={H - 1} textAnchor="middle" fontSize="8" fill="#9ca3af">{l}</text>
        ))}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-secondary rounded" />
          <span className="text-[10px] text-on-surface-variant">{labelA}</span>
        </div>
        {labelB && dataB.some(v => v > 0) && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-violet-500 rounded border-t-2 border-dashed border-violet-500" />
            <span className="text-[10px] text-on-surface-variant">{labelB}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG DONUT CHART
// ─────────────────────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 80 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const r = 28, cx = size / 2, cy = size / 2, stroke = 10;
  const vis = segments.filter(s => s.value > 0);
  const total = vis.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size }} className="flex items-center justify-center text-xs text-on-surface-variant">—</div>;
  const ptAt = (a: number) => ({ x: cx + r * Math.cos(a * Math.PI / 180), y: cy + r * Math.sin(a * Math.PI / 180) });
  const arc = (s: number, e: number) => { const p = ptAt(s), q = ptAt(e); return `M ${p.x} ${p.y} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${q.x} ${q.y}`; };
  let startAngle = -90;
  const firstPct = Math.round((vis[0]?.value / total) * 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      {vis.map((s, i) => { const end = startAngle + (s.value / total) * 360; const d = arc(startAngle, end); startAngle = end; return <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="butt" />; })}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#374151" fontWeight="bold">{firstPct}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL BAR ROW
// ─────────────────────────────────────────────────────────────────────────────
function HBarRow({ label, sub, valueA, maxA, colorA = "#00677c", onClick }: {
  label: string; sub?: string; valueA: number; maxA: number; colorA?: string; onClick?: () => void;
}) {
  const pctA = maxA > 0 ? (valueA / maxA) * 100 : 0;
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-surface-container/60 transition-colors group cursor-pointer">
      <div className="flex items-center justify-between mb-1.5">
        <div><span className="text-xs font-bold text-on-surface">{label}</span>
          {sub && <span className="text-[10px] text-on-surface-variant ml-2">{sub}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-secondary">{fmtN(valueA)}</span>
          {onClick && <ArrowRight className="size-3 text-on-surface-variant group-hover:text-secondary transition-colors" />}
        </div>
      </div>
      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctA}%`, background: colorA }} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconColor, bg, border, growth, onClick }: {
  label: string; value: number; sub?: string; icon: React.ElementType;
  iconColor: string; bg: string; border: string; growth?: GrowthResult; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl border p-4 ${bg} ${border} ${onClick ? "cursor-pointer hover:-translate-y-0.5 transition-transform duration-200" : ""} relative overflow-hidden shadow-sm`}>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} border ${border}`}>
            <Icon size={16} className={iconColor} />
          </div>
          {growth && (
            <span className={`flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${growth.up ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {growth.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}{growth.pct}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-on-surface-variant font-medium mb-1">{label}</p>
        <p className={`text-2xl font-extrabold ${iconColor} leading-tight`}><CountUp value={value} /></p>
        {sub && <p className="text-[10px] text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT CHIP
// ─────────────────────────────────────────────────────────────────────────────
function InsightChip({ icon: Icon, text, color }: { icon: React.ElementType; text: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${color}`}>
      <Icon size={12} />{text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD PICKER
// ─────────────────────────────────────────────────────────────────────────────
type PeriodMode = "month" | "year" | "all";
type PeriodState = { mode: PeriodMode; year: number; month: number; label: string };

function PeriodPicker({ period, onChange, locale, c }: {
  period: PeriodState; onChange: (p: PeriodState) => void; locale: Locale; c: AnalyticsCopy;
}) {
  const { year, month, mode } = period;
  const gLabel = (y: number, m: number) => `${monthShortDE(locale, y, m)} ${y}`;
  const goMonth = (y: number, m: number) => onChange({ mode: "month", year: y, month: m, label: gLabel(y, m) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-surface-container rounded-xl p-0.5 gap-0.5">
        {([["month", c.periodMonth], ["year", c.periodYear], ["all", c.periodAll]] as [PeriodMode, string][]).map(([m, l]) => (
          <button key={m} type="button"
            onClick={() => {
              const n = new Date(); const y = n.getFullYear(), mo = n.getMonth() + 1;
              if (m === "month") goMonth(y, mo);
              else if (m === "year") onChange({ mode: "year", year: y, month: mo, label: `${c.yearLabel} ${y}` });
              else onChange({ mode: "all", year: y, month: mo, label: c.allTime });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === m ? "bg-secondary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === "month" && (
        <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-2 py-1.5">
          <button type="button" onClick={() => month === 1 ? goMonth(year - 1, 12) : goMonth(year, month - 1)}
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"><ChevronRight size={14} /></button>
          <span className="text-xs font-bold text-on-surface min-w-[100px] text-center">{gLabel(year, month)}</span>
          <button type="button" onClick={() => month === 12 ? goMonth(year + 1, 1) : goMonth(year, month + 1)}
            className="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"><ChevronLeft size={14} /></button>
        </div>
      )}
      {mode === "year" && (
        <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-2 py-1.5">
          <button type="button" onClick={() => onChange({ ...period, year: year - 1, label: `${c.yearLabel} ${year - 1}` })}
            className="text-on-surface-variant hover:text-secondary cursor-pointer"><ChevronRight size={14} /></button>
          <span className="text-xs font-bold text-on-surface min-w-[60px] text-center">{year}</span>
          <button type="button" onClick={() => onChange({ ...period, year: year + 1, label: `${c.yearLabel} ${year + 1}` })}
            className="text-on-surface-variant hover:text-secondary cursor-pointer"><ChevronLeft size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH + SORT BAR
// ─────────────────────────────────────────────────────────────────────────────
function SearchSortBar({ search, onSearch, sortLabel, onSort, sortUp, placeholder }: {
  search: string; onSearch: (v: string) => void; sortLabel: string; onSort: () => void; sortUp: boolean; placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/40">
      <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2">
        <Search size={11} className="text-on-surface-variant" />
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant" />
      </div>
      <button type="button" onClick={onSort}
        className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-low rounded-xl px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors cursor-pointer">
        {sortUp ? <SortAsc size={11} /> : <SortDesc size={11} />} {sortLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE FORMS
// ─────────────────────────────────────────────────────────────────────────────
function InlinePlanEditForm({ plan, locale, c }: { plan: CompletionPlanSummary; locale: Locale; c: AnalyticsCopy }) {
  const [state, formAction, isPending] = useActionState(updatePlanProgressAction, { ok: false, message: "" });
  return (
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3.5 rounded-2xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="planId" value={plan.id} />
      {state.message && (
        <div className={`rounded-lg p-2.5 text-xs font-semibold ${state.ok ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"}`}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block mb-1.5">Status</label>
        <select name="status" defaultValue={plan.status}
          className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none">
          <option value="in_progress">{c.statusInProgress}</option>
          <option value="submitted">{c.statusComplete}</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block mb-1.5">
          {c.drawerCompleted} ({plan.completedItems} / {plan.totalItems})
        </label>
        <input type="number" name="completedItems" min={0} max={plan.totalItems} defaultValue={plan.completedItems}
          className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Save className="size-4" />} className="w-full justify-center">
        {isPending ? c.drawerSaving : c.drawerSave}
      </Button>
    </form>
  );
}

function InlineStepMarkForm({ stepId, locale, c }: { stepId: string; locale: Locale; c: AnalyticsCopy }) {
  const [state, formAction, isPending] = useActionState(markToolStepPerformedAction, { ok: false, message: "" });
  return (
    <form action={formAction} className="border-outline-variant bg-surface-container-low grid gap-3 rounded-2xl border p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="stepId" value={stepId} />
      {state.message && (
        <div className={`rounded-lg p-2.5 text-xs font-semibold ${state.ok ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"}`}>
          {state.message}
        </div>
      )}
      <div>
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block mb-1.5">{c.drawerPerformedDate}</label>
        <input type="date" name="performedAt" defaultValue={new Date().toISOString().slice(0, 10)}
          className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-10 w-full rounded-xl border px-3 text-sm outline-none" />
      </div>
      <Button type="submit" disabled={isPending} icon={<Check className="size-4" />} className="w-full justify-center">
        {isPending ? c.drawerSaving : c.drawerMarkDone}
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED STANDALONE CARDS (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
export function EscalationInteractiveCard({ step, locale, c }: {
  step: MandatoryStepEscalation; locale: Locale; c: AnalyticsCopy;
}) {
  const { open } = useDetailDrawer();
  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: step.toolName, subtitle: step.leafItemName,
      icon: <AlertTriangle className="size-6 text-rose-600" />,
      accentColor: "critical",
      badge: { label: c.drawerOverdueLabel, variant: "critical" },
      kpis: [
        { label: c.drawerTurnus, value: `${step.recurrenceDays}d`, color: "text-amber-600" },
        { label: c.drawerDuration, value: `${step.estimatedMinutes}m`, color: "text-blue-600" },
      ],
      sections: [
        {
          label: c.drawerStatusSection, content: (
            <InfoGrid items={[
              { icon: <Layers className="size-4" />, label: c.drawerObject, value: step.leafItemName },
              { icon: <Clock className="size-4" />, label: c.drawerLastPerformed, value: formatDate(step.lastPerformedAt, locale, c.drawerLastPerformed) },
            ]} />
          ),
        },
        { label: c.drawerMarkDoneSection, content: <InlineStepMarkForm stepId={step.id} locale={locale} c={c} /> },
      ],
    };
    open(config);
  }, [open, step, locale, c]);

  return (
    <button type="button" onClick={openDrawer}
      className="border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-rose-500/20 text-rose-700 flex items-center justify-center">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-on-surface group-hover:text-rose-700 transition-colors truncate">{step.toolName}</p>
          <p className="text-xs text-rose-800 font-medium truncate mt-0.5">{step.leafItemName}</p>
        </div>
      </div>
      <ArrowRight className="size-4 text-rose-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
    </button>
  );
}

export function LastCleanedInteractiveCard({ item, locale, copy }: {
  item: LastCleanedItem; locale: Locale;
  copy: { lastCleaned: string; neverCleaned: string; minutes: string; recurrenceDays: string; section: string };
}) {
  const { open } = useDetailDrawer();
  const openDrawer = useCallback(() => {
    const config: DrawerConfig = {
      title: item.name, subtitle: item.sectionName,
      icon: <CheckCircle2 className="size-6 text-emerald-600" />,
      accentColor: "success",
      badge: { label: item.lastCleanedAt ? copy.lastCleaned : copy.neverCleaned, variant: item.lastCleanedAt ? "success" : "warning" },
      kpis: [
        { label: copy.minutes, value: `${item.estimatedMinutes}m`, color: "text-emerald-600" },
        { label: copy.recurrenceDays, value: item.recurrenceDays ? `${item.recurrenceDays}d` : "—", color: "text-blue-600" },
      ],
      sections: [{
        label: copy.lastCleaned, content: (
          <InfoGrid items={[
            { icon: <Clock className="size-4" />, label: copy.lastCleaned, value: formatDate(item.lastCleanedAt, locale, copy.neverCleaned) },
            { icon: <Layers className="size-4" />, label: copy.section, value: item.sectionName },
          ]} />
        ),
      }],
    };
    open(config);
  }, [open, item, locale, copy]);

  return (
    <button type="button" onClick={openDrawer}
      className="border-outline-variant/60 bg-surface-container-lowest hover:border-secondary group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
          <CheckCircle2 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">{item.name}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{item.sectionName} · {formatDate(item.lastCleanedAt, locale, copy.neverCleaned)}</p>
        </div>
      </div>
      <ArrowRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ██████  MAIN ANALYTICS DASHBOARD  ██████
// ─────────────────────────────────────────────────────────────────────────────
export function ReportsInteractiveMain({
  plans, lastCleanedItems, escalations, locale, copy, clients, selectedClientId,
}: {
  plans: readonly CompletionPlanSummary[];
  lastCleanedItems: readonly LastCleanedItem[];
  escalations: readonly MandatoryStepEscalation[];
  locale: Locale;
  clients?: readonly ReportsClientOption[];
  selectedClientId?: string | null;
  copy: ReportsMainCopy;
}) {
  const c = copy.analytics;
  const now = new Date();

  // ── Smart default: find the most recent month that has real data ────────────
  const smartDefault = useMemo((): PeriodState => {
    if (plans.length === 0) {
      // No data at all → show "all" so at least the empty state is visible
      return { mode: "all", year: now.getFullYear(), month: now.getMonth() + 1, label: c.allTime };
    }
    // Find the most recent workDate in the plans array
    const latestDate = plans.reduce((best, p) => (p.workDate > best ? p.workDate : best), plans[0].workDate);
    const y = parseInt(latestDate.slice(0, 4), 10);
    const m = parseInt(latestDate.slice(5, 7), 10);
    return {
      mode: "month", year: y, month: m,
      label: `${monthShortDE(locale, y, m)} ${y}`,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally static — only computed once on mount from server-passed props

  const [period, setPeriod] = useState<PeriodState>(smartDefault);
  const [activeTab, setActiveTab] = useState<ActiveSubTab>("overview");
  const [planSearch, setPlanSearch] = useState("");
  const [planSortUp, setPlanSortUp] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffSortUp, setStaffSortUp] = useState(false);
  const { open } = useDetailDrawer();

  // ── Period filter ──────────────────────────────────────────────────────────
  const periodPlans = useMemo(() => {
    if (period.mode === "all") return plans;
    return plans.filter(p => {
      if (period.mode === "month") return p.workDate.slice(0, 7) === `${period.year}-${String(period.month).padStart(2, "0")}`;
      if (period.mode === "year") return p.workDate.startsWith(String(period.year));
      return true;
    });
  }, [plans, period]);


  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalPlans = periodPlans.length;
  const completePlans = periodPlans.filter(p => p.isComplete).length;
  const incompletePlansCount = totalPlans - completePlans;
  const completionRate = totalPlans > 0 ? Math.round((completePlans / totalPlans) * 100) : 0;
  const totalItems = periodPlans.reduce((s, p) => s + p.totalItems, 0);
  const completedItems = periodPlans.reduce((s, p) => s + p.completedItems, 0);
  const itemCompletionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // ── Growth ─────────────────────────────────────────────────────────────────
  const prevGrowth = useMemo(() => {
    if (period.mode !== "month") return null;
    const prev = period.month === 1 ? { year: period.year - 1, month: 12 } : { year: period.year, month: period.month - 1 };
    const prevYm = `${prev.year}-${String(prev.month).padStart(2, "0")}`;
    const prevPlans = plans.filter(p => p.workDate.slice(0, 7) === prevYm);
    return { plans: growthLabel(completePlans, prevPlans.filter(p => p.isComplete).length) };
  }, [period, plans, completePlans]);

  // ── 6-month trend ──────────────────────────────────────────────────────────
  const trend6 = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(period.year, period.month - 1 - (5 - i), 1);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const inM = plans.filter(p => p.workDate.slice(0, 7) === ym);
    return { label: monthShortDE(locale, y, m), completed: inM.filter(p => p.isComplete).length, total: inM.length };
  }), [plans, period, locale]);

  // ── By staff ───────────────────────────────────────────────────────────────
  const byStaffRaw = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; items: number }> = {};
    periodPlans.forEach(p => {
      if (!map[p.employeeId]) map[p.employeeId] = { name: p.employeeName, total: 0, completed: 0, items: 0 };
      map[p.employeeId].total++;
      if (p.isComplete) map[p.employeeId].completed++;
      map[p.employeeId].items += p.completedItems;
    });
    return Object.values(map);
  }, [periodPlans]);

  const byStaff = useMemo(() => {
    let r = [...byStaffRaw];
    if (staffSearch) r = r.filter(x => x.name.toLowerCase().includes(staffSearch.toLowerCase()));
    r.sort((a, b) => staffSortUp ? a.completed - b.completed : b.completed - a.completed);
    return r;
  }, [byStaffRaw, staffSearch, staffSortUp]);

  const maxStaffCompleted = Math.max(...byStaff.map(x => x.completed), 1);

  // ── Filtered plans ─────────────────────────────────────────────────────────
  const filteredPlans = useMemo(() => {
    let r = [...periodPlans];
    if (planSearch) r = r.filter(p => p.employeeName.toLowerCase().includes(planSearch.toLowerCase()));
    r.sort((a, b) => planSortUp
      ? new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
      : new Date(b.workDate).getTime() - new Date(a.workDate).getTime()
    );
    return r;
  }, [periodPlans, planSearch, planSortUp]);

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!itemSearch) return lastCleanedItems;
    return lastCleanedItems.filter(i =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.sectionName.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [lastCleanedItems, itemSearch]);

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list: { icon: React.ElementType; text: string; color: string }[] = [];
    if (completionRate >= 90) list.push({ icon: Award, text: interpolate(c.insightExcellent, { rate: completionRate }), color: "bg-emerald-50 text-emerald-700 border-emerald-200" });
    else if (completionRate < 50 && totalPlans > 0) list.push({ icon: AlertTriangle, text: interpolate(c.insightLow, { rate: completionRate }), color: "bg-red-50 text-red-600 border-red-200" });
    if (escalations.length > 0) list.push({ icon: ShieldAlert, text: interpolate(c.insightEscalations, { count: escalations.length }), color: "bg-amber-50 text-amber-700 border-amber-200" });
    if (byStaff[0]) list.push({ icon: Users, text: interpolate(c.insightTopStaff, { name: byStaff[0].name, count: byStaff[0].completed }), color: "bg-blue-50 text-blue-700 border-blue-200" });
    if (incompletePlansCount > 0) list.push({ icon: Clock, text: interpolate(c.insightOpenPlans, { count: incompletePlansCount }), color: "bg-violet-50 text-violet-700 border-violet-200" });
    return list.slice(0, 4);
  }, [completionRate, escalations.length, byStaff, incompletePlansCount, totalPlans, c]);

  // ── CSV & PDF Export ───────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const rows = filteredPlans.map(p => [
      p.employeeName, p.workDate, p.isComplete ? c.statusComplete : c.statusInProgress,
      p.completedItems, p.totalItems, `${p.totalItems > 0 ? Math.round((p.completedItems / p.totalItems) * 100) : 0}%`,
    ]);
    const hdr = [c.csvEmployee, c.csvDate, c.csvStatus, c.csvDone, c.csvTotal, c.csvProgress];
    exportToCSV(`nobleclean_${period.label.replace(/\s/g, "_")}.csv`, hdr, rows);
  }, [filteredPlans, period.label, c]);

  const exportPDF = useCallback(() => {
    const rows = filteredPlans.map(p => [
      p.employeeName, p.workDate, p.isComplete ? c.statusComplete : c.statusInProgress,
      p.completedItems, p.totalItems, `${p.totalItems > 0 ? Math.round((p.completedItems / p.totalItems) * 100) : 0}%`,
    ]);
    const hdr = [c.csvEmployee, c.csvDate, c.csvStatus, c.csvDone, c.csvTotal, c.csvProgress];
    exportToPDF(`Leistungs- & Qualitätsbericht (${period.label})`, "Detaillierte Übersicht aller Tagespläne und Fortschritte", hdr, rows, `nobleclean_berichte_${period.label.replace(/\s/g, "_")}.pdf`);
  }, [filteredPlans, period.label, c]);

  const subTabs: { id: ActiveSubTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: c.tabOverview, icon: BarChart3 },
    { id: "plans", label: `${c.tabPlans} (${totalPlans})`, icon: CalendarDays },
    { id: "items", label: `${c.tabItems} (${lastCleanedItems.length})`, icon: Layers },
    { id: "staff", label: `${c.tabStaff} (${byStaffRaw.length})`, icon: Users },
  ];

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-secondary/5 to-transparent rounded-2xl border border-secondary/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-sm">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-on-surface">{c.title}</h1>
              <p className="text-[10px] text-on-surface-variant">{period.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-0.5 gap-0.5">
              <button type="button" className="px-3 py-1 rounded-lg text-[11px] font-bold bg-secondary text-white cursor-pointer">{c.filterAll}</button>
              <button type="button" className="px-3 py-1 rounded-lg text-[11px] font-bold text-on-surface-variant hover:text-on-surface cursor-pointer">{c.filterComplete}</button>
              <button type="button" className="px-3 py-1 rounded-lg text-[11px] font-bold text-on-surface-variant hover:text-on-surface cursor-pointer">{c.filterOpen}</button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer">
                <Download size={12} className="text-emerald-600" /> Excel (.csv)
              </button>
              <button type="button" onClick={exportPDF}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition cursor-pointer">
                <Printer size={12} className="text-blue-600" /> PDF Bericht
              </button>
            </div>
          </div>
        </div>
        <PeriodPicker period={period} onChange={setPeriod} locale={locale} c={c} />
      </div>

      {/* ── SUB TABS ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-container rounded-2xl p-1">
        {subTabs.map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
            <tab.icon size={12} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-4">

          {/* Growth Banner */}
          {prevGrowth?.plans && (
            <div className="flex flex-wrap gap-2 items-center bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-2.5">
              <TrendingUp size={13} className="text-on-surface-variant" />
              <span className="text-[11px] text-on-surface-variant">{c.compareLastMonth}</span>
              <span className={`flex items-center gap-0.5 text-[11px] font-extrabold ${prevGrowth.plans.up ? "text-emerald-600" : "text-red-500"}`}>
                {c.plansGrowth} {prevGrowth.plans.up ? "▲" : "▼"}{prevGrowth.plans.pct}%
              </span>
            </div>
          )}

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label={c.kpiPlansTotal} value={totalPlans} sub={`${completePlans} ${c.completedLabel}`}
              icon={CalendarDays} iconColor="text-secondary" bg="bg-secondary/5" border="border-secondary/20"
              growth={prevGrowth?.plans} onClick={() => setActiveTab("plans")} />
            <StatCard label={c.kpiCompletionRate} value={completionRate} sub={`${incompletePlansCount} ${c.openLabel}`}
              icon={Target} iconColor="text-emerald-700" bg="bg-emerald-50" border="border-emerald-100" />
            <StatCard label={c.kpiEscalations} value={escalations.length} sub={c.escalationsTitle}
              icon={ShieldAlert} iconColor={escalations.length > 0 ? "text-rose-700" : "text-emerald-700"}
              bg={escalations.length > 0 ? "bg-rose-50" : "bg-emerald-50"} border={escalations.length > 0 ? "border-rose-100" : "border-emerald-100"} />
            <StatCard label={c.kpiItemRate} value={itemCompletionRate} sub={`${completedItems}/${totalItems}`}
              icon={Layers} iconColor="text-violet-700" bg="bg-violet-50" border="border-violet-100"
              onClick={() => setActiveTab("items")} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-secondary" />
                <span className="text-xs font-extrabold text-on-surface">{c.chartEvolution}</span>
              </div>
              <LineAreaChart
                dataA={trend6.map(d => d.completed)} dataB={trend6.map(d => d.total)}
                labelA={c.chartLabelCompleted} labelB={c.chartLabelTotal}
                labels={trend6.map(d => d.label)} />
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={13} className="text-orange-500" />
                <span className="text-xs font-extrabold text-on-surface">{c.chartRateTrend}</span>
              </div>
              <LineAreaChart
                dataA={trend6.map(d => d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0)}
                labelA={c.chartLabelRate}
                labels={trend6.map(d => d.label)} />
            </div>
          </div>

          {/* Completion Rates + Donut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4 sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Target size={13} className="text-teal-600" />
                <span className="text-xs font-extrabold text-on-surface">{c.ratesTitle}</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: `${c.plansCompleted} (${completePlans}/${totalPlans})`, value: completionRate, color: "from-secondary to-secondary/70" },
                  { label: `${c.itemsCompleted} (${completedItems}/${totalItems})`, value: itemCompletionRate, color: "from-violet-500 to-violet-400" },
                  { label: c.mandatoryCompleted, value: escalations.length === 0 ? 100 : Math.max(0, 100 - escalations.length * 10), color: "from-emerald-500 to-emerald-400" },
                ].map((row, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-semibold">{row.label}</span>
                      <span className="font-extrabold text-secondary">{row.value}%</span>
                    </div>
                    <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={13} className="text-purple-600" />
                <span className="text-xs font-extrabold text-on-surface">{c.distributionTitle}</span>
              </div>
              <div className="flex items-center gap-4 justify-center">
                <DonutChart segments={[
                  { value: completePlans, color: "#00677c", label: c.completedLabel },
                  { value: incompletePlansCount, color: "#e5e7eb", label: c.openLabel },
                ]} size={90} />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-secondary" />
                    <span className="text-on-surface-variant">{c.completedLabel}: {completePlans}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-surface-container" />
                    <span className="text-on-surface-variant">{c.openLabel}: {incompletePlansCount}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" />
                <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wide">{c.insightsTitle}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.map((ins, i) => <InsightChip key={i} icon={ins.icon} text={ins.text} color={`${ins.color} border`} />)}
              </div>
            </div>
          )}

          {/* Top Staff + Escalations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {byStaff.length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center gap-2">
                  <Users size={13} className="text-secondary" />
                  <span className="text-xs font-extrabold text-on-surface">{c.topStaffTitle}</span>
                </div>
                {byStaff.slice(0, 5).map((emp, i) => (
                  <HBarRow key={emp.name + i} label={emp.name}
                    sub={interpolate(c.subLabelEmployee, { count: emp.total, items: emp.items })}
                    valueA={emp.completed} maxA={maxStaffCompleted} />
                ))}
              </div>
            )}
            {escalations.length > 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-rose-500/30 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-rose-500/20 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-rose-600" />
                  <span className="text-xs font-extrabold text-rose-700">{c.escalationsTitle} ({escalations.length})</span>
                </div>
                <div className="divide-y divide-rose-500/10">
                  {escalations.slice(0, 5).map(step => (
                    <EscalationInteractiveCard key={step.id} step={step} locale={locale} c={c} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center p-8 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <p className="text-xs font-extrabold text-emerald-700 text-center">{c.noEscalationsTitle}</p>
                <p className="text-[10px] text-emerald-600 text-center">{c.noEscalationsBody}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PLANS TAB                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "plans" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SearchSortBar search={planSearch} onSearch={setPlanSearch}
            sortLabel={c.sortDate} onSort={() => setPlanSortUp(v => !v)} sortUp={planSortUp}
            placeholder={c.searchPlaceholder} />
          <div className="divide-y divide-outline-variant/40">
            {filteredPlans.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">{c.noPlans}</p>
            ) : filteredPlans.map(plan => {
              const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
              return (
                <button key={plan.id} type="button"
                  onClick={() => {
                    open({
                      title: plan.employeeName, subtitle: formatDate(plan.workDate, locale, ""),
                      icon: <BarChart3 className="size-6 text-secondary" />,
                      accentColor: plan.isComplete ? "success" : "warning",
                      badge: { label: plan.isComplete ? c.plansBadgeComplete : c.plansBadgeInProgress, variant: plan.isComplete ? "success" : "warning" },
                      kpis: [
                        { label: c.drawerProgress, value: `${pct}%`, color: "text-secondary" },
                        { label: c.drawerCompleted, value: `${plan.completedItems}/${plan.totalItems}`, color: "text-emerald-600" },
                      ],
                      sections: [
                        {
                          label: c.drawerStatusSection, content: (
                            <div className="grid gap-3">
                              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden p-0.5">
                                <div className="bg-secondary h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <InfoGrid items={[
                                { icon: <User className="size-4" />, label: c.drawerEmployee, value: plan.employeeName },
                                { icon: <CalendarDays className="size-4" />, label: c.drawerDate, value: formatDate(plan.workDate, locale, "—") },
                              ]} />
                            </div>
                          ),
                        },
                        { label: c.drawerEditSection, content: <InlinePlanEditForm plan={plan} locale={locale} c={c} /> },
                      ],
                    } as DrawerConfig);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container/50 transition-colors text-left cursor-pointer group">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {initials(plan.employeeName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-extrabold text-on-surface group-hover:text-secondary transition-colors truncate">{plan.employeeName}</span>
                      <span className="text-xs font-extrabold text-secondary shrink-0 ml-2">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                      <span>{formatDate(plan.workDate, locale, "—")}</span>
                      <span>{plan.completedItems}/{plan.totalItems}</span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ITEMS TAB                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "items" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/40">
            <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2">
              <Search size={11} className="text-on-surface-variant" />
              <input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder={c.itemSearchPlaceholder}
                className="flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant" />
            </div>
          </div>
          <div className="divide-y divide-outline-variant/40">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">{c.noItems}</p>
            ) : filteredItems.map(item => (
              <LastCleanedInteractiveCard key={item.id} item={item} locale={locale} copy={copy} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STAFF TAB                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "staff" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <SearchSortBar search={staffSearch} onSearch={setStaffSearch}
            sortLabel={c.sortCompletions} onSort={() => setStaffSortUp(v => !v)} sortUp={staffSortUp}
            placeholder={c.searchPlaceholder} />
          {byStaff.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-8">{c.noStaff}</p>
          ) : byStaff.map((emp, i) => (
            <div key={emp.name + i} className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/50 transition-colors">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {initials(emp.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-extrabold text-on-surface truncate">{emp.name}</span>
                  <span className="text-[11px] font-bold text-secondary shrink-0 ml-2">
                    {emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                  <span>{interpolate(c.staffPlansCompleted, { done: emp.completed, total: emp.total })}</span>
                  <span>{interpolate(c.staffItemsDone, { count: emp.items })}</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-700"
                    style={{ width: `${maxStaffCompleted > 0 ? (emp.completed / maxStaffCompleted) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
