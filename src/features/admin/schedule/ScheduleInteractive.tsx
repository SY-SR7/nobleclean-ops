"use client";

import { CalendarDays, User, Building2, Clock, ArrowRight } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
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

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "full",
  }).format(date);
}

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

  const openScheduleDrawer = useCallback(
    (item: ScheduleListItem) => {
      const config: DrawerConfig = {
        title: item.employeeName,
        subtitle: `${item.clientName} · ${formatDate(item.workDate, locale)}`,
        icon: <CalendarDays className="size-5" />,
        accentColor: "secondary",
        sections: [
          {
            label: "Schichtdetails",
            content: (
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="text-secondary size-5 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.employees}
                    </p>
                    <p className="text-on-surface text-sm font-medium">{item.employeeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="text-secondary size-5 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.clients}
                    </p>
                    <p className="text-on-surface text-sm font-medium">{item.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-secondary size-5 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.workDate}
                    </p>
                    <p className="text-on-surface text-sm font-medium">{formatDate(item.workDate, locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-secondary size-5 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.allocatedHours}
                    </p>
                    <p className="text-on-surface text-sm font-medium">{item.allocatedHours}h</p>
                  </div>
                </div>
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
                className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest text-left shadow-sm transition-all hover:border-secondary hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                onClick={() => openScheduleDrawer(item)}
              >
                {/* Top: avatar + hours badge */}
                <div className="flex items-center justify-between bg-surface-container px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-on-secondary font-bold text-base">
                    {initials}
                  </div>
                  <div className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 text-xs font-bold">
                    {item.allocatedHours}h
                  </div>
                </div>
                {/* Body */}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <p className="text-on-surface group-hover:text-secondary font-bold text-sm transition-colors truncate">
                    {item.employeeName}
                  </p>
                  <p className="text-on-surface-variant text-xs flex items-center gap-1.5 truncate">
                    <Building2 className="size-3 shrink-0" />
                    {item.clientName}
                  </p>
                  <p className="text-on-surface-variant text-xs flex items-center gap-1.5 mt-1">
                    <CalendarDays className="size-3 shrink-0" />
                    {formatDateShort(item.workDate, locale)}
                  </p>
                </div>
                <div className="h-1 bg-secondary" />
              </button>
            );
          })}
        </div>
      ) : (
        /* ── List View: grouped by date ── */
        <div className="grid gap-4">
          {dateEntries.map(([date, items]) => (
            <div key={date}>
              <p className="text-on-surface-variant mb-2 text-xs font-bold uppercase tracking-wider">
                {formatDate(date, locale)}
              </p>
              <div className="border-outline-variant divide-outline-variant divide-y overflow-hidden rounded-xl border shadow-sm">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-container cursor-pointer"
                    onClick={() => openScheduleDrawer(item)}
                    type="button"
                  >
                    <div className="bg-secondary/10 text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {item.employeeName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface group-hover:text-secondary text-sm font-semibold truncate transition-colors">
                        {item.employeeName}
                      </p>
                      <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3" />
                        {item.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-secondary-container text-on-secondary-container rounded-full px-2.5 py-1 text-xs font-bold">
                        {item.allocatedHours}h
                      </div>
                      <ArrowRight className="text-on-surface-variant size-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
