"use client";

import { CalendarDays, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { EntityLink } from "@/components/ui";
import { EmployeeAvailabilityCalendar } from "@/features/admin/staff/EmployeeAvailabilityCalendar";
import { DeleteScheduleForm } from "./ScheduleForms";
import type { ScheduleListItem } from "./queries";
import type { Locale } from "@/i18n/routing";

type ScheduleInteractiveProps = Readonly<{
  schedules: readonly ScheduleListItem[];
  locale: Locale;
  copy: {
    workDate: string;
    employees: string;
    clients: string;
    allocatedHours: string;
  };
}>;

function formatDateShort(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export function ScheduleInteractive({ schedules, locale, copy }: ScheduleInteractiveProps) {
  const { open } = useDetailDrawer();
  const [viewMode, setViewMode] = useViewMode("schedule", "grid");
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState<{ id: string; name: string } | null>(null);

  // Extract unique clients for availability calendar modal
  const uniqueClients = Array.from(
    new Map(schedules.map((s) => [s.clientId, { id: s.clientId, name: s.clientName }])).values()
  );

  const openScheduleDrawer = useCallback(
    (item: ScheduleListItem) => {
      const config: DrawerConfig = {
        title: item.employeeName,
        subtitle: `${item.clientName} · ${formatDateShort(item.workDate, locale)}`,
        icon: <CalendarDays className="size-6" />,
        accentColor: "secondary",
        badge: {
          label: `${item.allocatedHours} Stunden`,
          variant: "success",
        },
        kpis: [
          { label: "Stunden", value: `${item.allocatedHours}h`, color: "text-emerald-600" },
          { label: "Mitarbeiter", value: item.employeeName.split(" ")[0], color: "text-blue-600" },
          { label: "Kunde", value: item.clientName.split(" ")[0], color: "text-violet-600" },
        ],
        sections: [
          {
            label: "Mitarbeiter-Verfügbarkeit",
            content: (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarEmployee({ id: item.employeeId, name: item.employeeName })}
                  className="w-full bg-secondary text-on-secondary flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold shadow-sm transition hover:opacity-90 cursor-pointer"
                >
                  <CalendarDays className="size-5" />
                  Verfügbarkeit & Schichten (Nächster Monat)
                </button>
              </div>
            ),
          },
          {
            label: "Schicht bearbeiten / löschen",
            content: (
              <DeleteScheduleForm
                scheduleId={item.id}
                copy={{
                  allocatedHoursLabel: "Stunden",
                  clientLabel: "Kunde",
                  createTitle: "Schicht erstellen",
                  deleteAction: "Schicht löschen",
                  deleted: "Schicht gelöscht",
                  employeeLabel: "Mitarbeiter",
                  error: "Fehler beim Löschen",
                  fieldError: "Ungültige Eingabe",
                  inactiveClient: "Inaktiver Kunde",
                  save: "Speichern",
                  saved: "Gespeichert",
                  updateTitle: "Schicht bearbeiten",
                  workDateLabel: "Datum",
                }}
                locale={locale}
              />
            ),
          },
        ],
      };
      open(config);
    },
    [open, locale, copy],
  );

  // Group by date
  const byDate = schedules.reduce<Record<string, ScheduleListItem[]>>((acc, item) => {
    if (!acc[item.workDate]) acc[item.workDate] = [];
    acc[item.workDate].push(item);
    return acc;
  }, {});

  const dateEntries = Object.entries(byDate);

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {schedules.length} Schicht{schedules.length !== 1 ? "en" : ""}
          {" · "}
          {dateEntries.length} Tage
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schedules.map((item) => {
            const initials = item.employeeName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={item.id}
                type="button"
                className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest text-left shadow-sm transition-all hover:border-secondary hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                onClick={() => openScheduleDrawer(item)}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low px-4 py-3">
                  <span className="text-secondary font-bold text-xs flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {formatDateShort(item.workDate, locale)}
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {item.allocatedHours} Std.
                  </span>
                </div>
                {/* Body */}
                <div className="flex items-center gap-3 p-4">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <EntityLink
                      id={item.employeeId}
                      name={item.employeeName}
                      type="employee"
                      locale={locale}
                      showInitials
                      className="text-sm font-bold"
                    />
                    <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5 truncate">
                      <Building2 className="size-3 shrink-0" />
                      {item.clientName}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="grid gap-2">
          {schedules.map((item) => {
            const initials = item.employeeName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={item.id}
                type="button"
                className="group flex w-full items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left shadow-sm transition-all hover:border-secondary hover:shadow-md cursor-pointer"
                onClick={() => openScheduleDrawer(item)}
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <EntityLink
                    id={item.employeeId}
                    name={item.employeeName}
                    type="employee"
                    locale={locale}
                    showInitials
                    className="text-sm"
                  />
                  <p className="text-on-surface-variant text-xs flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Building2 className="size-3" />{item.clientName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDateShort(item.workDate, locale)}</span>
                  </p>
                </div>
                <span className="bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {item.allocatedHours} Std.
                </span>
                <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {/* Full Availability & Shift Calendar Modal */}
      {selectedCalendarEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-surface-container-lowest border-outline-variant w-full max-w-5xl rounded-3xl border p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-secondary" />
                <h2 className="font-heading text-primary-container text-xl font-bold">
                  Mitarbeiter Verfügbarkeit & Schichten
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarEmployee(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full p-2 text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <EmployeeAvailabilityCalendar
              employeeId={selectedCalendarEmployee.id}
              employeeName={selectedCalendarEmployee.name}
              clients={uniqueClients}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
