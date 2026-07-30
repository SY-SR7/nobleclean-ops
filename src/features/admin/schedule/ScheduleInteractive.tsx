"use client";

import { CalendarDays, User, Building2, Clock, ArrowRight } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
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

export function ScheduleInteractive({ schedules, locale, copy }: ScheduleInteractiveProps) {
  const { open } = useDetailDrawer();

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
                    <p className="text-on-surface text-sm font-medium">
                      {formatDate(item.workDate, locale)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-secondary size-5 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.allocatedHours}
                    </p>
                    <p className="font-heading text-on-surface text-2xl font-bold">
                      {item.allocatedHours}h
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: "Schicht löschen",
            content: (
              <DeleteScheduleForm
                scheduleId={item.id}
                copy={{
                  allocatedHoursLabel: "Geplante Stunden",
                  clientLabel: "Kunde",
                  createTitle: "Schicht anlegen",
                  deleteAction: "Schicht jetzt löschen",
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

  return (
    <div className="grid gap-4">
      {Object.entries(byDate).map(([date, items]) => (
        <div key={date}>
          <p className="text-on-surface-variant mb-2 text-xs font-bold uppercase tracking-wider">
            {formatDate(date, locale)}
          </p>
          <div className="border-outline-variant divide-outline-variant divide-y overflow-hidden rounded-lg border">
            {items.map((item) => (
              <button
                key={item.id}
                className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-container"
                onClick={() => openScheduleDrawer(item)}
                type="button"
              >
                <div className="bg-secondary/10 text-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
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
  );
}
