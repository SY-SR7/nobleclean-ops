"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertTriangle,
  Plus,
  Trash2,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";

export type EmployeeAvailabilityDay = {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string;
  isAvailable: boolean; // Employee preference: true = can work, false = off/cannot work
  preferenceNote?: string;
  assignedShift?: {
    id: string;
    clientId: string;
    clientName: string;
    allocatedHours: number;
  } | null;
  otherEmployeesAvailableCount: number;
  otherEmployeesUnavailableCount: number;
};

type EmployeeAvailabilityCalendarProps = Readonly<{
  employeeId: string;
  employeeName: string;
  clients: readonly { id: string; name: string }[];
  locale: Locale;
  onSaveShift?: (dateStr: string, clientId: string, hours: number) => void;
  onDeleteShift?: (shiftId: string) => void;
}>;

/** Generates deterministic employee availability preferences for next month for demo */
function getDeterministicAvailability(employeeId: string, dateStr: string): boolean {
  const hash = (employeeId + dateStr).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  // 75% available, 25% unavailable
  return hash % 4 !== 0;
}

/** Generates deterministic team availability counts */
function getDeterministicTeamCounts(dateStr: string) {
  const hash = dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const available = (hash % 5) + 2; // 2..6
  const unavailable = (hash % 3) + 1; // 1..3
  return { available, unavailable };
}

export function EmployeeAvailabilityCalendar({
  employeeId,
  employeeName,
  clients,
  locale,
  onSaveShift,
  onDeleteShift,
}: EmployeeAvailabilityCalendarProps) {
  // Target next month by default
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getMonth();
  });

  // Local shifts state to support live interactive toggling
  const [assignedShifts, setAssignedShifts] = useState<
    Record<string, { id: string; clientId: string; clientName: string; allocatedHours: number }>
  >({});

  // Quick shift modal state
  const [selectedDateForShift, setSelectedDateForShift] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [allocatedHours, setAllocatedHours] = useState(8);

  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  }, [currentYear, currentMonth, locale]);

  // Generate days for calendar grid
  const days = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    // Shift Sunday to 6 (Mon = 0, ..., Sun = 6)
    const adjustedFirstDay = (firstDayOfWeek + 6) % 7;

    const list: (EmployeeAvailabilityDay | null)[] = [];

    // Empty padding days
    for (let i = 0; i < adjustedFirstDay; i++) {
      list.push(null);
    }

    // Days of month
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(dayNum).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const dayName = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        weekday: "short",
      }).format(dateObj);

      const isAvailable = getDeterministicAvailability(employeeId, dateStr);
      const { available, unavailable } = getDeterministicTeamCounts(dateStr);
      const assigned = assignedShifts[dateStr] || null;

      list.push({
        dateStr,
        dayNumber: dayNum,
        dayName,
        isAvailable,
        assignedShift: assigned,
        otherEmployeesAvailableCount: available,
        otherEmployeesUnavailableCount: unavailable,
      });
    }

    return list;
  }, [currentYear, currentMonth, employeeId, assignedShifts, locale]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Stats calculation
  const totalDays = days.filter((d): d is EmployeeAvailabilityDay => d !== null);
  const availableCount = totalDays.filter((d) => d.isAvailable).length;
  const unavailableCount = totalDays.filter((d) => !d.isAvailable).length;
  const scheduledCount = totalDays.filter((d) => d.assignedShift !== null).length;
  const conflictCount = totalDays.filter((d) => d.assignedShift && !d.isAvailable).length;

  const handleAssignShift = (dateStr: string) => {
    if (!selectedClientId) return;
    const client = clients.find((c) => c.id === selectedClientId) || clients[0];
    const shift = {
      id: `shift-${dateStr}`,
      clientId: selectedClientId,
      clientName: client?.name || "Client",
      allocatedHours,
    };
    setAssignedShifts((prev) => ({ ...prev, [dateStr]: shift }));
    if (onSaveShift) onSaveShift(dateStr, selectedClientId, allocatedHours);
    setSelectedDateForShift(null);
  };

  const handleRemoveShift = (dateStr: string) => {
    const existing = assignedShifts[dateStr];
    setAssignedShifts((prev) => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
    if (existing && onDeleteShift) onDeleteShift(existing.id);
  };

  const weekDayHeaders = locale === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="grid gap-6 w-full">
      {/* Header bar & stats */}
      <div className="border-outline-variant bg-surface-container-lowest flex flex-col gap-4 rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 text-secondary flex h-12 w-12 items-center justify-center rounded-2xl">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                Verfügbarkeit & Schichtplanung
              </p>
              <h2 className="font-heading text-primary-container text-xl font-bold">
                {employeeName}
              </h2>
            </div>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-2 bg-surface-container-low rounded-2xl p-1.5 border border-outline-variant/60">
            <button
              type="button"
              onClick={prevMonth}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>

            <span className="font-heading text-primary-container min-w-36 text-center text-sm font-bold capitalize">
              {monthName}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Legend & Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-3">
            <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-emerald-800 text-xs font-bold uppercase">Möglich (Verfügbar)</p>
              <p className="font-heading text-emerald-900 text-lg font-extrabold">{availableCount} Tage</p>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-center gap-3">
            <XCircle className="size-6 text-rose-600 shrink-0" />
            <div>
              <p className="text-rose-800 text-xs font-bold uppercase">Nicht möglich (Frei)</p>
              <p className="font-heading text-rose-900 text-lg font-extrabold">{unavailableCount} Tage</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-3">
            <Clock className="size-6 text-blue-600 shrink-0" />
            <div>
              <p className="text-blue-800 text-xs font-bold uppercase">Zugewiesene Schichten</p>
              <p className="font-heading text-blue-900 text-lg font-extrabold">{scheduledCount} Schichten</p>
            </div>
          </div>

          <div className={cn(
            "rounded-2xl border p-3 flex items-center gap-3",
            conflictCount > 0 ? "border-amber-500/50 bg-amber-500/10" : "border-outline-variant bg-surface-container-low"
          )}>
            <AlertTriangle className={cn("size-6 shrink-0", conflictCount > 0 ? "text-amber-600" : "text-gray-400")} />
            <div>
              <p className="text-on-surface-variant text-xs font-bold uppercase">Konflikte</p>
              <p className={cn("font-heading text-lg font-extrabold", conflictCount > 0 ? "text-amber-800" : "text-on-surface")}>
                {conflictCount} Konflikte
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="border-outline-variant bg-surface-container-lowest rounded-3xl border p-6 shadow-sm">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {weekDayHeaders.map((day) => (
            <div key={day} className="text-on-surface-variant font-extrabold text-xs uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 30-Day Grid */}
        <div className="grid grid-cols-7 gap-2.5">
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-surface-container-low/30 min-h-32 rounded-2xl border border-dashed border-outline-variant/40"
                />
              );
            }

            const hasShift = !!day.assignedShift;
            const isConflict = hasShift && !day.isAvailable;

            return (
              <div
                key={day.dateStr}
                className={cn(
                  "relative flex flex-col justify-between min-h-36 rounded-2xl p-3 border transition-all shadow-sm group",
                  day.isAvailable
                    ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500"
                    : "bg-rose-500/5 border-rose-500/30 hover:border-rose-500",
                  hasShift && !isConflict && "ring-2 ring-blue-500 bg-blue-500/5",
                  isConflict && "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500"
                )}
              >
                {/* Card Top Header */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-heading text-on-surface text-base font-extrabold">
                      {day.dayNumber}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase">
                      {day.dayName}
                    </span>
                  </div>

                  {/* Availability Badge */}
                  {day.isAvailable ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> Möglich
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <XCircle className="size-3" /> Frei (Nicht möglich)
                    </span>
                  )}
                </div>

                {/* Conflict Alert if any */}
                {isConflict && (
                  <div className="bg-amber-500/20 text-amber-800 rounded-xl p-1.5 text-[10px] font-bold flex items-center gap-1 my-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Konflikt: Frei gewünscht!</span>
                  </div>
                )}

                {/* Assigned Shift Box if scheduled */}
                {day.assignedShift ? (
                  <div className="bg-blue-600 text-white rounded-xl p-2 text-xs shadow-sm mt-1">
                    <div className="flex items-center justify-between gap-1 font-bold">
                      <span className="truncate">{day.assignedShift.clientName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(day.dateStr)}
                        className="hover:text-red-200 transition cursor-pointer p-0.5"
                        title="Schicht stornieren"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-blue-100 mt-0.5 flex items-center gap-1">
                      <Clock className="size-2.5" /> {day.assignedShift.allocatedHours} Std.
                    </p>
                  </div>
                ) : null}

                {/* Team Status Info */}
                <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                  <span className="text-[9px] text-on-surface-variant font-semibold flex items-center gap-1">
                    <Users className="size-2.5" />
                    {day.otherEmployeesAvailableCount} andere verfügbar
                  </span>

                  {/* Add Shift Button */}
                  {!day.assignedShift && (
                    <button
                      type="button"
                      onClick={() => setSelectedDateForShift(day.dateStr)}
                      className={cn(
                        "flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer shadow-sm",
                        day.isAvailable
                          ? "bg-secondary text-on-secondary hover:opacity-90"
                          : "bg-amber-600 text-white hover:bg-amber-700"
                      )}
                    >
                      <Plus className="size-3" /> Schicht
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Shift Assignment Dialog */}
      {selectedDateForShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border-outline-variant w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-primary-container text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-secondary" />
                Schicht zuteilen ({selectedDateForShift})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDateForShift(null)}
                className="text-on-surface-variant hover:text-on-surface text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-on-surface-variant text-sm">
              Wählen Sie den Kunden und die Stunden für <strong className="text-on-surface">{employeeName}</strong> am {selectedDateForShift}:
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5 shadow-sm">
                <label className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Building2 className="size-4 text-secondary" /> Kunde
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-transparent font-semibold text-on-surface text-sm outline-none cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5 shadow-sm">
                <label className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Clock className="size-4 text-secondary" /> Zugewiesene Stunden
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={allocatedHours}
                  onChange={(e) => setAllocatedHours(Number(e.target.value))}
                  className="w-full bg-transparent font-semibold text-on-surface text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDateForShift(null)}
                className="w-1/2 border-outline-variant text-on-surface hover:bg-surface-container rounded-2xl border py-3 text-xs font-bold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleAssignShift(selectedDateForShift)}
                className="w-1/2 bg-secondary text-on-secondary hover:opacity-90 rounded-2xl py-3 text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Schicht zuteilen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
