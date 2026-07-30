"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Save,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";

type EmployeeAvailabilityPickerProps = Readonly<{
  employeeName: string;
  locale: Locale;
}>;

export function EmployeeAvailabilityPicker({
  employeeName,
  locale,
}: EmployeeAvailabilityPickerProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getMonth();
  });

  const [availabilityState, setAvailabilityState] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  }, [currentYear, currentMonth, locale]);

  const days = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = (firstDayOfWeek + 6) % 7;

    const list: ({ dateStr: string; dayNumber: number; dayName: string; isAvailable: boolean } | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      list.push(null);
    }

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(dayNum).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const dayName = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        weekday: "short",
      }).format(dateObj);

      const defaultAvail = ((dayNum * 7) % 4) !== 0;
      const isAvailable = availabilityState[dateStr] !== undefined ? availabilityState[dateStr] : defaultAvail;

      list.push({
        dateStr,
        dayNumber: dayNum,
        dayName,
        isAvailable,
      });
    }

    return list;
  }, [currentYear, currentMonth, availabilityState, locale]);

  const toggleDay = (dateStr: string, currentVal: boolean) => {
    setAvailabilityState((prev) => ({
      ...prev,
      [dateStr]: !currentVal,
    }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const weekDayHeaders = locale === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="grid gap-6 w-full max-w-4xl mx-auto">
      <div className="border-outline-variant bg-surface-container-lowest flex flex-col gap-4 rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 text-secondary flex h-12 w-12 items-center justify-center rounded-2xl">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                Meine Verfügbarkeit (Nächster Monat)
              </p>
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {employeeName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low rounded-2xl p-1.5 border border-outline-variant/60">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => (m === 0 ? 11 : m - 1))}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="font-heading text-primary-container min-w-32 text-center text-sm font-bold capitalize">
              {monthName}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => (m === 11 ? 0 : m + 1))}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <p className="text-on-surface-variant text-xs leading-relaxed">
          Tippen Sie auf einen Tag, um zwischen 🟢 <strong>Verfügbar</strong> und 🔴 <strong>Frei</strong> zu wechseln.
        </p>

        {savedSuccess && (
          <div className="bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 rounded-2xl p-3 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="size-4 text-emerald-600" />
            Ihre Verfügbarkeit wurde erfolgreich gespeichert!
          </div>
        )}
      </div>

      <div className="border-outline-variant bg-surface-container-lowest rounded-3xl border p-6 shadow-sm">
        <div className="grid grid-cols-7 gap-2.5 mb-3 text-center">
          {weekDayHeaders.map((day) => (
            <div key={day} className="text-on-surface-variant font-extrabold text-xs uppercase py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2.5">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-surface-container-low/20 h-24 rounded-2xl border border-dashed border-outline-variant/30" />;
            }

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => toggleDay(day.dateStr, day.isAvailable)}
                className={cn(
                  "flex flex-col justify-between h-24 rounded-2xl p-3 border transition-all text-left cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95",
                  day.isAvailable
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 hover:border-emerald-600"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-950 hover:border-rose-600"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-heading text-base font-extrabold">{day.dayNumber}</span>
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant/70">{day.dayName}</span>
                </div>

                {day.isAvailable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                    <CheckCircle2 className="size-3" /> Verfügbar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-500/20 px-2 py-0.5 rounded-full w-fit">
                    <XCircle className="size-3" /> Frei
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant/60 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="bg-secondary text-on-secondary flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-md transition hover:opacity-90 cursor-pointer"
          >
            <Save className="size-4" />
            Verfügbarkeit speichern
          </button>
        </div>
      </div>
    </div>
  );
}
