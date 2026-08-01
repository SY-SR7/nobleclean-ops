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
  ListFilter,
  Grid,
  List,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";

export type EmployeeAvailabilityDay = {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string;
  isAvailable: boolean;
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

function getDeterministicAvailability(employeeId: string, dateStr: string): boolean {
  const hash = (employeeId + dateStr).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 4 !== 0;
}

function getDeterministicTeamCounts(dateStr: string) {
  const hash = dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const available = (hash % 5) + 2;
  const unavailable = (hash % 3) + 1;
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
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const nextM = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextM.getMonth();
  });

  const [assignedShifts, setAssignedShifts] = useState<
    Record<string, { id: string; clientId: string; clientName: string; allocatedHours: number }>
  >({});

  const [viewStyle, setViewStyle] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "available" | "unavailable" | "scheduled">("all");

  const [selectedDayDetail, setSelectedDayDetail] = useState<EmployeeAvailabilityDay | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [allocatedHours, setAllocatedHours] = useState(8);

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

    const list: (EmployeeAvailabilityDay | null)[] = [];

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

  const totalDays = days.filter((d): d is EmployeeAvailabilityDay => d !== null);
  const availableCount = totalDays.filter((d) => d.isAvailable).length;
  const unavailableCount = totalDays.filter((d) => !d.isAvailable).length;
  const scheduledCount = totalDays.filter((d) => d.assignedShift !== null).length;
  const conflictCount = totalDays.filter((d) => d.assignedShift && !d.isAvailable).length;

  const filteredListDays = useMemo(() => {
    if (filterType === "available") return totalDays.filter((d) => d.isAvailable);
    if (filterType === "unavailable") return totalDays.filter((d) => !d.isAvailable);
    if (filterType === "scheduled") return totalDays.filter((d) => d.assignedShift !== null);
    return totalDays;
  }, [totalDays, filterType]);

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
    setSelectedDayDetail(null);
  };

  const handleRemoveShift = (dateStr: string) => {
    const existing = assignedShifts[dateStr];
    setAssignedShifts((prev) => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
    if (existing && onDeleteShift) onDeleteShift(existing.id);
    setSelectedDayDetail(null);
  };

  const handleDayDetailBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    const clickX = e.clientX;
    const clickY = e.clientY;

    const modalPanels = document.querySelectorAll<HTMLElement>("[data-modal-panel='true']");
    let clickedInsideParentCard = false;

    modalPanels.forEach((panel) => {
      if (e.currentTarget.contains(panel)) return;
      const rect = panel.getBoundingClientRect();
      if (
        clickX >= rect.left &&
        clickX <= rect.right &&
        clickY >= rect.top &&
        clickY <= rect.bottom
      ) {
        clickedInsideParentCard = true;
      }
    });

    setSelectedDayDetail(null);
    if (!clickedInsideParentCard) {
      window.dispatchEvent(new CustomEvent("nc-tab-change"));
    }
  };

  const weekDayHeaders = locale === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="grid gap-6 w-full max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="border-outline-variant bg-surface-container-lowest flex flex-col gap-5 rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 text-secondary flex h-12 w-12 items-center justify-center rounded-2xl">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                Verfügbarkeit & Schichten (Nächster Monat)
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
              onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
                else setCurrentMonth((m) => m - 1);
              }}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="font-heading text-primary-container min-w-36 text-center text-sm font-bold capitalize">
              {monthName}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
                else setCurrentMonth((m) => m + 1);
              }}
              className="hover:bg-surface-container rounded-xl p-2 text-on-surface transition cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Clean Filter Tabs & View Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-outline-variant/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                filterType === "all" ? "bg-secondary text-on-secondary shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              )}
            >
              Alle ({totalDays.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("available")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1",
                filterType === "available" ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
              )}
            >
              <CheckCircle2 className="size-3.5" /> Verfügbar ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("unavailable")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1",
                filterType === "unavailable" ? "bg-rose-600 text-white shadow-sm" : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20"
              )}
            >
              <XCircle className="size-3.5" /> Frei ({unavailableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("scheduled")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1",
                filterType === "scheduled" ? "bg-blue-600 text-white shadow-sm" : "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
              )}
            >
              <Clock className="size-3.5" /> Schichten ({scheduledCount})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/60 w-fit">
            <button
              type="button"
              onClick={() => setViewStyle("grid")}
              className={cn("p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer", viewStyle === "grid" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant")}
            >
              <Grid className="size-4" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("list")}
              className={cn("p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer", viewStyle === "list" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant")}
            >
              <List className="size-4" /> Liste
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {viewStyle === "grid" ? (
        <div className="border-outline-variant bg-surface-container-lowest rounded-3xl border p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {weekDayHeaders.map((day) => (
              <div key={day} className="text-on-surface-variant font-extrabold text-xs uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-surface-container-low/20 h-28 rounded-2xl border border-dashed border-outline-variant/30" />;
              }

              const hasShift = !!day.assignedShift;
              const isConflict = hasShift && !day.isAvailable;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDayDetail(day)}
                  className={cn(
                    "flex flex-col justify-between h-28 rounded-2xl p-3 border transition-all text-left cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group relative overflow-hidden",
                    day.isAvailable
                      ? "bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-600"
                      : "bg-rose-500/10 border-rose-500/40 hover:border-rose-600",
                    hasShift && !isConflict && "ring-2 ring-blue-500 bg-blue-500/10",
                    isConflict && "ring-2 ring-amber-500 bg-amber-500/20"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-heading text-on-surface text-base font-extrabold">{day.dayNumber}</span>
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant/70">{day.dayName}</span>
                  </div>

                  {/* Clean Single Badge */}
                  <div className="my-auto">
                    {hasShift ? (
                      <div className="bg-blue-600 text-white rounded-xl px-2 py-1 text-[10px] font-extrabold shadow-sm truncate">
                        ⚡ {day.assignedShift?.clientName} ({day.assignedShift?.allocatedHours}h)
                      </div>
                    ) : day.isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" /> Möglich
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-500/20 px-2 py-0.5 rounded-full">
                        <XCircle className="size-3" /> Frei
                      </span>
                    )}
                  </div>

                  {/* Conflict indicator icon */}
                  {isConflict && (
                    <span className="absolute top-2 right-2 text-amber-600" title="Frei gewünscht!">
                      <AlertTriangle className="size-4 fill-amber-500/20" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Clean List View */
        <div className="border-outline-variant bg-surface-container-lowest max-h-[60vh] overflow-y-auto rounded-3xl border p-4 sm:p-6 shadow-sm divide-y divide-outline-variant/60">
          {filteredListDays.map((day) => (
            <div key={day.dateStr} className="flex items-center justify-between py-3.5 hover:bg-surface-container-low/40 px-3 rounded-2xl transition">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-surface-container-low flex items-center justify-center font-bold text-sm text-primary-container">
                  {day.dayNumber}
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">
                    {day.dayName}, {day.dateStr}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {day.otherEmployeesAvailableCount} andere Mitarbeiter verfügbar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {day.isAvailable ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="size-3.5" /> Verfügbar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-500/20 px-3 py-1 rounded-full">
                    <XCircle className="size-3.5" /> Frei gewünscht
                  </span>
                )}

                {day.assignedShift ? (
                  <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    <span>⚡ {day.assignedShift.clientName} ({day.assignedShift.allocatedHours}h)</span>
                    <button type="button" onClick={() => handleRemoveShift(day.dateStr)} className="hover:text-red-200 cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedDayDetail(day)}
                    className="bg-secondary/10 hover:bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition flex items-center gap-1"
                  >
                    <Plus className="size-3.5" /> Schicht zuteilen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Clean Interactive Day Sheet / Popover Modal */}
      {selectedDayDetail && (
        <div
          onClick={handleDayDetailBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            data-modal-panel="true"
            className="bg-surface-container-lowest border-outline-variant w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Schicht & Verfügbarkeit</p>
                <h3 className="font-heading text-primary-container text-lg font-bold">
                  {selectedDayDetail.dayName}, {selectedDayDetail.dateStr}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedDayDetail(null)} className="text-on-surface-variant hover:text-on-surface font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Availability Info */}
              <div className={cn("p-4 rounded-2xl border flex items-center justify-between", selectedDayDetail.isAvailable ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950" : "bg-rose-500/10 border-rose-500/40 text-rose-950")}>
                <span className="text-xs font-bold uppercase">Wunsch-Status:</span>
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  {selectedDayDetail.isAvailable ? <><CheckCircle2 className="size-4 text-emerald-600" /> Verfügbar</> : <><XCircle className="size-4 text-rose-600" /> Frei (Nicht möglich)</>}
                </span>
              </div>

              {/* Shift Assignment Section */}
              {selectedDayDetail.assignedShift ? (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase">Zugewiesene Schicht:</span>
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-500/20 px-2 py-0.5 rounded-full">{selectedDayDetail.assignedShift.allocatedHours} Std.</span>
                  </div>
                  <p className="font-bold text-base text-blue-950 flex items-center gap-2">
                    <Building2 className="size-4 text-blue-600" /> {selectedDayDetail.assignedShift.clientName}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveShift(selectedDayDetail.dateStr)}
                    className="w-full mt-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="size-4" /> Schicht stornieren
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-on-surface-variant uppercase">Neue Schicht zuteilen:</p>
                  <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5">
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

                  <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5">
                    <label className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      <Clock className="size-4 text-secondary" /> Stunden
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

                  <button
                    type="button"
                    onClick={() => handleAssignShift(selectedDayDetail.dateStr)}
                    className="w-full bg-secondary text-on-secondary hover:opacity-90 rounded-2xl py-3 text-xs font-bold transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="size-4" /> Schicht zuteilen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
