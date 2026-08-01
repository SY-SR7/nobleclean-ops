"use client";

import { useState } from "react";
import {
  Clock,
  User,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Building2,
  Check,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useToast } from "@/components/ui/toast";
import type { ScheduleListItem, ScheduleEmployeeOption } from "./queries";

export type ShiftSuggestion = {
  label: string;
  start: string;
  end: string;
};

const SMART_SUGGESTIONS: ShiftSuggestion[] = [
  { label: "04:00 – 07:00 (Frühschicht 3h)", start: "04:00", end: "07:00" },
  { label: "05:30 – 08:30 (Samstagsschicht 3h)", start: "05:30", end: "08:30" },
  { label: "01:00 – 04:00 (Nachtschicht 3h)", start: "01:00", end: "04:00" },
  { label: "08:00 – 11:00 (Vormittag 3h)", start: "08:00", end: "11:00" },
  { label: "14:00 – 17:00 (Nachmittag 3h)", start: "14:00", end: "17:00" },
];

export type DayShiftModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  formattedDate: string;
  daySchedules: readonly ScheduleListItem[];
  allEmployees: readonly ScheduleEmployeeOption[];
  clientId: string;
  onSaveShift: (dateStr: string, employeeId: string, startTime: string, endTime: string, hours: number) => void;
  onDeleteShift: (scheduleId: string) => void;
}>;

export function DayShiftModal({
  isOpen,
  onClose,
  dateStr,
  formattedDate,
  daySchedules,
  allEmployees,
  clientId,
  onSaveShift,
  onDeleteShift,
}: DayShiftModalProps) {
  const { toast } = useToast();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(allEmployees[0]?.id || "");
  const [startTime, setStartTime] = useState<string>("04:00");
  const [endTime, setEndTime] = useState<string>("07:00");

  // Calculate duration automatically from start and end time
  const calculatedHours = (() => {
    try {
      const [sH, sM] = startTime.split(":").map(Number);
      const [eH, eM] = endTime.split(":").map(Number);
      let diffMins = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
      if (diffMins <= 0) diffMins += 24 * 60; // handle overnight shifts
      return Math.round((diffMins / 60) * 100) / 100;
    } catch {
      return 3.0;
    }
  })();

  const handleApplySuggestion = (s: ShiftSuggestion) => {
    setStartTime(s.start);
    setEndTime(s.end);
    toast(`Tageszeit ${s.start} - ${s.end} gewählt`, "success");
  };

  const handleAddShift = () => {
    if (!selectedEmpId) {
      toast("Bitte wählen Sie einen Mitarbeiter!", "error");
      return;
    }

    onSaveShift(dateStr, selectedEmpId, startTime, endTime, calculatedHours);
    toast("Schicht erfolgreich gespeichert!", "success");
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Tagesplanung — ${formattedDate}`}
      subtitle="Verwalten Sie die Schichtzeiten (Start & Ende) und zugewiesenen Mitarbeiter für diesen Tag."
    >
      <div className="space-y-6">
        {/* Existing Shifts for this day */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center justify-between">
            <span>Eingeteilte Mitarbeiter ({daySchedules.length})</span>
            <span className="text-secondary font-bold">
              Gesamt: {daySchedules.reduce((sum, s) => sum + s.allocatedHours, 0)} Std.
            </span>
          </h4>

          {daySchedules.length > 0 ? (
            <div className="grid gap-2.5 max-h-52 overflow-y-auto pr-1">
              {daySchedules.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                      {shift.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">{shift.employeeName}</p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-2.5 mt-0.5">
                        <span className="font-semibold text-blue-600 flex items-center gap-1">
                          <Clock className="size-3" /> {shift.startTime || "04:00"} – {shift.endTime || "07:00"}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                          {shift.allocatedHours} Std.
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteShift(shift.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                    title="Schicht löschen"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant p-4 rounded-2xl bg-surface-container-low/50 text-center border border-outline-variant/40">
              Für diesen Tag sind noch keine Mitarbeiter eingeteilt.
            </p>
          )}
        </div>

        {/* Add New Shift Section */}
        <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 space-y-4">
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Plus className="size-4 text-secondary" /> Neue Schicht zuweisen
          </h4>

          {/* Employee Selector */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
              Mitarbeiter auswählen
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-secondary outline-none transition"
            >
              {allEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Smart Time Shift Suggestions */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1 mb-2">
              <Sparkles className="size-3 text-secondary" /> Vorgeschlagene Tageszeiten
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SMART_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySuggestion(s)}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    startTime === s.start && endTime === s.end
                      ? "bg-secondary text-on-secondary border-secondary shadow-sm"
                      : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-secondary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
                Start-Zeit (Vom)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
                End-Zeit (Bis)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none"
              />
            </div>
          </div>

          {/* Automatically Computed Duration Display */}
          <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Clock className="size-4 text-secondary" /> Berechnete Arbeitszeit:
            </span>
            <span className="text-sm font-extrabold text-secondary bg-surface-container-lowest px-3 py-1 rounded-lg border border-secondary/30">
              {calculatedHours} Std. ({startTime} – {endTime})
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddShift}
            className="w-full h-11 bg-secondary text-on-secondary font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="size-4" /> Schicht Speichern & Hinzufügen
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
