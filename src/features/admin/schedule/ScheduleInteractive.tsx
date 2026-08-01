"use client";

import {
  CalendarDays,
  Building2,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Filter,
  Plus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { EntityLink, InlineEditField, useToast } from "@/components/ui";
import { EmployeeAvailabilityCalendar } from "@/features/admin/staff/EmployeeAvailabilityCalendar";
import { DeleteScheduleForm } from "./ScheduleForms";
import { quickUpdateScheduleHoursAction } from "./actions";
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

function formatDateWithDay(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  "bg-gradient-to-br from-indigo-500 to-purple-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-rose-500 to-pink-600",
  "bg-gradient-to-br from-blue-500 to-cyan-600",
];

function getAvatarBg(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_BG_CLASSES[hash % AVATAR_BG_CLASSES.length];
}

export function ScheduleInteractive({ schedules, locale, copy }: ScheduleInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useViewMode("schedule", "grid");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState<{ id: string; name: string } | null>(null);

  /** Inline update allocated hours */
  async function saveHours(scheduleId: string, next: string): Promise<string | null> {
    const hours = parseFloat(next);
    if (Number.isNaN(hours) || hours < 0.5 || hours > 24) return "Ungültig (0.5 – 24)";
    const fd = new FormData();
    fd.append("scheduleId", scheduleId);
    fd.append("locale", locale);
    fd.append("allocatedHours", String(hours));
    const result = await quickUpdateScheduleHoursAction(fd);
    if (result.ok) { toast("Gespeichert", "success"); return null; }
    toast("Fehler beim Speichern", "error");
    return "Fehler";
  }

  // Extract unique clients list for filtering
  const clientsList = useMemo(() => {
    const map = new Map<string, string>();
    schedules.forEach((s) => {
      if (!map.has(s.clientId)) map.set(s.clientId, s.clientName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [schedules]);

  // Filter schedules by client
  const filteredSchedules = useMemo(() => {
    if (selectedClientId === "all") return schedules;
    return schedules.filter((s) => s.clientId === selectedClientId);
  }, [schedules, selectedClientId]);

  // Group schedules strictly by Work Date
  const groupedByDate = useMemo(() => {
    const groups: {
      dateStr: string;
      totalHours: number;
      items: ScheduleListItem[];
    }[] = [];

    const map = new Map<string, ScheduleListItem[]>();
    filteredSchedules.forEach((item) => {
      if (!map.has(item.workDate)) map.set(item.workDate, []);
      map.get(item.workDate)!.push(item);
    });

    // Sort dates ascending
    const sortedDates = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

    sortedDates.forEach((dateStr) => {
      const items = map.get(dateStr)!;
      const totalHours = Math.round(items.reduce((sum, i) => sum + i.allocatedHours, 0) * 100) / 100;
      groups.push({ dateStr, totalHours, items });
    });

    return groups;
  }, [filteredSchedules]);

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
                  onClick={() =>
                    open({
                      title: item.employeeName,
                      subtitle: "Mitarbeiter Verfügbarkeit & Schichten",
                      icon: <CalendarDays className="size-6 text-secondary" />,
                      accentColor: "secondary",
                      sections: [
                        {
                          content: (
                            <EmployeeAvailabilityCalendar
                              employeeId={item.employeeId}
                              employeeName={item.employeeName}
                              clients={clientsList}
                              locale={locale}
                            />
                          ),
                        },
                      ],
                    })
                  }
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
    [open, locale],
  );

  return (
    <div className="grid gap-6">
      {/* Client Filter Bar & View Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/60 pb-4">
        {/* Client Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
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
            Alle Kunden ({schedules.length})
          </button>
          {clientsList.map((client) => {
            const count = schedules.filter((s) => s.clientId === client.id).length;
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

        {/* View Toggle & Summary Count */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <p className="text-on-surface-variant text-xs font-semibold">
            {groupedByDate.length} Arbeitstage · {filteredSchedules.length} Schichten
          </p>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "grid" ? (
        /* ── Modern Grouped By Day Card Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupedByDate.map((group) => (
            <div
              key={group.dateStr}
              className="flex flex-col justify-between rounded-3xl border border-outline-variant/70 bg-surface-container-lowest overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-secondary/50"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low/60 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-secondary/10 text-secondary flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary/20">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-on-surface text-base font-extrabold capitalize">
                      {formatDateWithDay(group.dateStr, locale)}
                    </h3>
                    <p className="text-on-surface-variant text-[11px] font-semibold flex items-center gap-1.5 mt-0.5">
                      <Users className="size-3 text-secondary" />
                      {group.items.length} Mitarbeiter
                    </p>
                  </div>
                </div>

                <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 text-xs font-extrabold shadow-sm border border-secondary/20">
                  {group.totalHours}h
                </span>
              </div>

              {/* Staff Roster List for this Day */}
              <div className="p-4 space-y-2.5 divide-y divide-outline-variant/40 flex-1">
                {group.items.map((item) => {
                  const initials = item.employeeName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const avatarBg = getAvatarBg(item.employeeName);

                  return (
                    <div
                      key={item.id}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group/item"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Employee Avatar */}
                        <div
                          className={`h-9 w-9 shrink-0 rounded-xl ${avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openScheduleDrawer(item)}
                            className="text-left font-bold text-sm text-on-surface hover:text-secondary transition-colors truncate block"
                          >
                            {item.employeeName}
                          </button>
                          <p className="text-on-surface-variant text-[11px] flex items-center gap-1 truncate mt-0.5">
                            <Building2 className="size-3 shrink-0" />
                            {item.clientName}
                          </p>
                        </div>
                      </div>

                      {/* Allocated Hours & Edit Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="bg-surface-container-low px-2.5 py-1 rounded-xl border border-outline-variant/60 flex items-center gap-1 text-xs font-bold">
                          <InlineEditField
                            value={String(item.allocatedHours)}
                            displayClassName="text-xs font-bold text-on-surface"
                            onSave={(next) => saveHours(item.id, next)}
                          />
                          <span className="text-on-surface-variant text-[10px]">Std.</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openScheduleDrawer(item)}
                          className="text-on-surface-variant hover:text-secondary p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                        >
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Compact Grouped Table List View ── */
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div
              key={group.dateStr}
              className="rounded-3xl border border-outline-variant/70 bg-surface-container-lowest overflow-hidden shadow-sm"
            >
              {/* Day Section Title */}
              <div className="bg-surface-container-low/60 px-5 py-3 border-b border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-secondary" />
                  <span className="font-heading text-sm font-extrabold text-on-surface capitalize">
                    {formatDateWithDay(group.dateStr, locale)}
                  </span>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">
                  {group.items.length} Mitarbeiter · {group.totalHours} Stunden gesamt
                </span>
              </div>

              {/* Roster Table */}
              <div className="divide-y divide-outline-variant/40">
                {group.items.map((item) => {
                  const initials = item.employeeName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const avatarBg = getAvatarBg(item.employeeName);

                  return (
                    <div
                      key={item.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-surface-container-low/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-xl ${avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">{item.employeeName}</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <Building2 className="size-3" /> {item.clientName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <InlineEditField
                            value={String(item.allocatedHours)}
                            displayClassName="text-xs font-bold text-on-secondary-container"
                            onSave={(next) => saveHours(item.id, next)}
                          />
                          <span>Std.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => openScheduleDrawer(item)}
                          className="p-1 text-on-surface-variant hover:text-secondary cursor-pointer"
                        >
                          <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
