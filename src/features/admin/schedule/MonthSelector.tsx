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
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/60">
      {/* Month Navigator Control */}
      <div className="flex items-center gap-2">
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

        {/* Hidden DatePicker with Auto-Submit on Change */}
        <div className="relative ml-1">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => {
              if (e.target.value) handleSelectMonth(e.target.value);
            }}
            className="w-10 h-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-transparent cursor-pointer focus:outline-none text-xs"
            title="Datum-Auswahl öffnen"
          />
          <CalendarDays className="size-4 text-on-surface-variant absolute top-3 left-3 pointer-events-none" />
        </div>
      </div>

      <span className="text-xs font-bold text-on-surface-variant hidden sm:inline-block">
        Automatische Monats-Aktualisierung
      </span>
    </div>
  );
}
