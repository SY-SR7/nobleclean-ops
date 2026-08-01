"use client";

import {
  CalendarDays,
  Building2,
  Clock,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { useToast } from "@/components/ui/toast";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { exportToCSV, exportToPDF, exportSchedulePDF } from "@/lib/export-utils";
import { FileSpreadsheet, Printer } from "lucide-react";
import { EmployeeAvailabilityCalendar } from "@/features/admin/staff/EmployeeAvailabilityCalendar";
import { DeleteScheduleForm } from "./ScheduleForms";
import { DayShiftModal } from "./DayShiftModal";
import {
  quickUpdateScheduleHoursAction,
  createScheduleAction,
  deleteScheduleAction,
} from "./actions";
import type { ScheduleListItem, ScheduleEmployeeOption } from "./queries";
import type { Locale } from "@/i18n/routing";

type ScheduleInteractiveProps = Readonly<{
  schedules: readonly ScheduleListItem[];
  employees?: readonly ScheduleEmployeeOption[];
  locale: Locale;
  copy: {
    workDate: string;
    employees: string;
    clients: string;
    allocatedHours: string;
  };
}>;

function formatDateWithDay(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDateShort(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

const AVATAR_BG_CLASSES = [
  "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
  "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
  "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
  "bg-gradient-to-br from-blue-500 to-cyan-600 text-white",
];

function getAvatarBg(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_BG_CLASSES[hash % AVATAR_BG_CLASSES.length];
}

// Fallback staff list if not passed from server
const DEFAULT_EMPLOYEES: ScheduleEmployeeOption[] = [
  { id: "e1a00000-0001-4000-8001-000000000001", fullName: "Mohamad", defaultDailyHours: 3.0 },
  { id: "e2a00000-0002-4000-8002-000000000002", fullName: "Eghbal", defaultDailyHours: 3.0 },
  { id: "e3a00000-0003-4000-8003-000000000003", fullName: "Hady", defaultDailyHours: 3.0 },
  { id: "e4a00000-0004-4000-8004-000000000004", fullName: "Shaikh", defaultDailyHours: 3.0 },
  { id: "df9343ca-d64d-41eb-8d62-2ce2697962a4", fullName: "Ammar", defaultDailyHours: 3.0 },
  { id: "7f954cc9-5aca-4a02-945c-5d1de1ba5987", fullName: "Khalid", defaultDailyHours: 3.0 },
];

export function ScheduleInteractive({ schedules: initialSchedules, employees = DEFAULT_EMPLOYEES, locale, copy }: ScheduleInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();
  const [schedulesList, setSchedulesList] = useState<ScheduleListItem[]>([...initialSchedules]);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedDayModal, setSelectedDayModal] = useState<{ dateStr: string; formattedDate: string } | null>(null);

  // Extract unique clients list for filtering
  const clientsList = useMemo(() => {
    const map = new Map<string, string>();
    schedulesList.forEach((s) => {
      if (!map.has(s.clientId)) map.set(s.clientId, s.clientName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [schedulesList]);

  // Filter schedules by client
  const filteredSchedules = useMemo(() => {
    if (selectedClientId === "all") return schedulesList;
    return schedulesList.filter((s) => s.clientId === selectedClientId);
  }, [schedulesList, selectedClientId]);

  // Group schedules by 7-Day Calendar Weeks
  const weeklyGroups = useMemo(() => {
    const map = new Map<string, ScheduleListItem[]>();
    filteredSchedules.forEach((item) => {
      if (!map.has(item.workDate)) map.set(item.workDate, []);
      map.get(item.workDate)!.push(item);
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    if (sortedDates.length === 0) return [];

    // Group into 7-day chunks (weeks)
    const weeks: {
      weekIndex: number;
      dates: {
        dateStr: string;
        formattedDate: string;
        items: ScheduleListItem[];
        totalHours: number;
      }[];
    }[] = [];

    let currentWeek: {
      dateStr: string;
      formattedDate: string;
      items: ScheduleListItem[];
      totalHours: number;
    }[] = [];
    let weekIndex = 1;

    sortedDates.forEach((dateStr, idx) => {
      const items = map.get(dateStr)!;
      const totalHours = Math.round(items.reduce((sum, i) => sum + i.allocatedHours, 0) * 100) / 100;
      const formattedDate = formatDateWithDay(dateStr, locale);

      currentWeek.push({ dateStr, formattedDate, items, totalHours });

      // Every 7 days or at the last date, wrap week
      if (currentWeek.length === 7 || idx === sortedDates.length - 1) {
        weeks.push({ weekIndex, dates: [...currentWeek] });
        currentWeek = [];
        weekIndex += 1;
      }
    });

    return weeks;
  }, [filteredSchedules, locale]);

  // Save new shift for a specific day with start & end time
  const handleSaveShiftForDay = async (
    dateStr: string,
    employeeId: string,
    startTime: string,
    endTime: string,
    hours: number
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    const empName = emp ? emp.fullName : "Mitarbeiter";
    const targetClientId = selectedClientId === "all" ? (clientsList[0]?.id || "c1a00000-0001-4000-8001-000000000001") : selectedClientId;
    const clientName = clientsList.find((c) => c.id === targetClientId)?.name || "John Reed Fitness";

    const newShift: ScheduleListItem = {
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      workDate: dateStr,
      employeeId,
      employeeName: empName,
      clientId: targetClientId,
      clientName,
      allocatedHours: hours,
      startTime,
      endTime,
    };

    // Update local state
    setSchedulesList((prev) => [...prev, newShift]);

    // Persist to server via FormAction
    const fd = new FormData();
    fd.append("clientId", targetClientId);
    fd.append("employeeId", employeeId);
    fd.append("workDate", dateStr);
    fd.append("allocatedHours", String(hours));
    fd.append("locale", locale);
    createScheduleAction(initialState, fd).catch(() => {});
  };

  // Delete shift
  const handleDeleteShift = async (scheduleId: string) => {
    setSchedulesList((prev) => prev.filter((s) => s.id !== scheduleId));
    toast("Schicht gelöscht", "success");
    const fd = new FormData();
    fd.append("id", scheduleId);
    fd.append("locale", locale);
    deleteScheduleAction(initialState, fd).catch(() => {});
  };

  const handleExportScheduleExcel = () => {
    const currentMonth = schedulesList[0]?.workDate?.slice(0, 7) || "2026-07";
    const headers = ["Datum", "Mitarbeiter Name", "Objekt / Kunde", "Schicht-Startzeit", "Schicht-Endzeit", "Stundenanzahl"];
    const rows = schedulesList.map((s) => [
      s.workDate,
      s.employeeName,
      s.clientName,
      s.startTime || "04:00",
      s.endTime || "07:00",
      `${s.allocatedHours} Std.`,
    ]);
    exportToCSV(`Nobleclean_Schichtplan_${currentMonth}.csv`, headers, rows);
    toast(`Schichtplan für ${currentMonth} als Excel (CSV) exportiert!`, "success");
  };

  const handleExportSchedulePDF = () => {
    const currentMonth = schedulesList[0]?.workDate?.slice(0, 7) || "2026-07";
    exportSchedulePDF(currentMonth, schedulesList);
  };

  const dayModalSchedules = useMemo(() => {
    if (!selectedDayModal) return [];
    return schedulesList.filter((s) => s.workDate === selectedDayModal.dateStr);
  }, [selectedDayModal, schedulesList]);

  return (
    <div className="grid gap-6">
      {/* TOOLBAR & CLIENT FILTER BAR */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/60 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-on-surface-variant text-xs font-bold flex items-center gap-1 mr-1">
              <Filter className="size-3.5 text-secondary" /> Kunde:
            </span>
            <button
              type="button"
              onClick={() => setSelectedClientId("all")}
              className={[
                "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                selectedClientId === "all"
                  ? "bg-secondary text-on-secondary shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/60",
              ].join(" ")}
            >
              Alle Kunden ({schedulesList.length})
            </button>
            {clientsList.map((client) => {
              const count = schedulesList.filter((s) => s.clientId === client.id).length;
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={[
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                    selectedClientId === client.id
                      ? "bg-secondary text-on-secondary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/60",
                  ].join(" ")}
                >
                  <Building2 className="size-3.5" />
                  {client.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Excel & PDF Exports */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportScheduleExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Schichtplan als Excel (CSV) exportieren"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" /> Excel (.csv)
            </button>
            <button
              type="button"
              onClick={handleExportSchedulePDF}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border border-blue-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Schichtplan als PDF Bericht drucken"
            >
              <Printer className="size-3.5 text-blue-600" /> PDF Drucken
            </button>
          </div>
        </div>

        <span className="text-xs text-on-surface-variant font-bold">
          7-Tage Wochenansicht · Klicken Sie auf einen Tag zum Bearbeiten der Schichtzeiten
        </span>
      </div>

      {/* 7-DAY WEEKLY GRID LAYOUT */}
      {weeklyGroups.length === 0 ? (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
          Keine Schichten für den ausgewählten Zeitraum gefunden.
        </p>
      ) : (
        <div className="space-y-8">
          {weeklyGroups.map((week) => (
            <div key={week.weekIndex} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase text-secondary tracking-wider flex items-center gap-2">
                  <CalendarDays className="size-4" /> Woche {week.weekIndex} ({week.dates[0]?.formattedDate} – {week.dates[week.dates.length - 1]?.formattedDate})
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  Gesamt: {week.dates.reduce((sum, d) => sum + d.totalHours, 0)} Std.
                </span>
              </div>

              {/* 7-Columns Grid (Mon - Sun) */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {week.dates.map((day) => (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDayModal({ dateStr: day.dateStr, formattedDate: day.formattedDate })}
                    className="group relative flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-sm hover:shadow-lg hover:border-secondary transition-all duration-200 cursor-pointer min-h-48"
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-outline-variant/50 pb-2 mb-2.5">
                        <span className="font-extrabold text-xs text-on-surface group-hover:text-secondary transition-colors">
                          {day.formattedDate}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {day.totalHours}h
                        </span>
                      </div>

                      {/* Scheduled Workers for this Day */}
                      {day.items.length > 0 ? (
                        <div className="space-y-2">
                          {day.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 rounded-xl bg-surface-container-low/80 border border-outline-variant/40 space-y-1 hover:bg-surface-container transition"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`size-5 rounded-full ${getAvatarBg(item.employeeName)} flex items-center justify-center font-bold text-[9px] shrink-0`}>
                                    {item.employeeName.charAt(0)}
                                  </div>
                                  <span className="font-bold text-xs text-on-surface truncate">
                                    {item.employeeName}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[10px] text-blue-700 font-extrabold bg-blue-500/10 px-1.5 py-0.5 rounded-md w-fit flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {item.startTime || "04:00"} – {item.endTime || "07:00"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-on-surface-variant/60 italic pt-4 text-center">
                          Frei / Keine Schicht
                        </p>
                      )}
                    </div>

                    {/* Footer add hint */}
                    <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-center gap-1 text-[10px] font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="size-3" /> Schicht anpassen
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAY SHIFT ASSIGNMENT MODAL */}
      {selectedDayModal && (
        <DayShiftModal
          isOpen={Boolean(selectedDayModal)}
          onClose={() => setSelectedDayModal(null)}
          dateStr={selectedDayModal.dateStr}
          formattedDate={selectedDayModal.formattedDate}
          daySchedules={dayModalSchedules}
          allEmployees={employees}
          clientId={selectedClientId}
          onSaveShift={handleSaveShiftForDay}
          onDeleteShift={handleDeleteShift}
        />
      )}
    </div>
  );
}

const initialState = { status: "idle" as const, code: null };
