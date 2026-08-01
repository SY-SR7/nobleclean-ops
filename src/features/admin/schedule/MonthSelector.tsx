"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/routing";

type MonthSelectorProps = Readonly<{
  currentMonth: string; // e.g. "2026-07" or "2026-08"
  locale: Locale;
}>;

function formatMonthLabel(monthStr: string, locale: Locale) {
  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return monthStr;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAdjacentMonth(monthStr: string, deltaMonths: number): string {
  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return monthStr;
  const d = new Date(year, month - 1 + deltaMonths, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const MONTH_OPTIONS = [
  { value: "2026-05", label: "Mai 2026" },
  { value: "2026-06", label: "Juni 2026" },
  { value: "2026-07", label: "Juli 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Dezember 2026" },
];

export function MonthSelector({ currentMonth, locale }: MonthSelectorProps) {
  const router = useRouter();

  const handleSelectMonth = (nextMonth: string) => {
    const search = new URLSearchParams();
    search.set("tab", "schedule");
    search.set("month", nextMonth);
    router.push(`/${locale}/admin?${search.toString()}`);
  };

  const prevMonth = getAdjacentMonth(currentMonth, -1);
  const nextMonth = getAdjacentMonth(currentMonth, 1);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/60">
      {/* Month Navigator Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleSelectMonth(prevMonth)}
          className="size-10 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface hover:bg-secondary hover:text-white transition flex items-center justify-center cursor-pointer shadow-sm"
          title={`Vorheriger Monat (${formatMonthLabel(prevMonth, locale)})`}
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Current Month Active Badge */}
        <div className="px-5 py-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/80 text-on-surface font-extrabold text-sm shadow-sm flex items-center gap-2 min-w-44 justify-center">
          <CalendarDays className="size-4 text-secondary" />
          <span>{formatMonthLabel(currentMonth, locale)}</span>
        </div>

        <button
          type="button"
          onClick={() => handleSelectMonth(nextMonth)}
          className="size-10 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface hover:bg-secondary hover:text-white transition flex items-center justify-center cursor-pointer shadow-sm"
          title={`Nächster Monat (${formatMonthLabel(nextMonth, locale)})`}
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Clean Styled Month Dropdown */}
        <div className="relative ml-1">
          <select
            value={currentMonth}
            onChange={(e) => handleSelectMonth(e.target.value)}
            className="h-10 px-3 pl-9 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface font-extrabold text-xs cursor-pointer focus:border-secondary outline-none transition shadow-sm"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <CalendarDays className="size-4 text-secondary absolute top-3 left-3 pointer-events-none" />
        </div>
      </div>

      <span className="text-xs font-bold text-on-surface-variant hidden sm:inline-block">
        Automatische Monats-Aktualisierung
      </span>
    </div>
  );
}
