"use client";

import {
  CalendarDays,
  User,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import {
  useDetailDrawer,
  type DrawerConfig,
} from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { EmployeeAvailabilityCalendar } from "./EmployeeAvailabilityCalendar";
import { EndAssignmentForm } from "./StaffAssignmentForms";
import type {
  StaffAssignmentListItem,
  StaffClientOption,
  StaffEmployeeOption,
} from "./queries";
import type { Locale } from "@/i18n/routing";

type StaffInteractiveProps = Readonly<{
  assignments: readonly StaffAssignmentListItem[];
  clients: readonly StaffClientOption[];
  employees: readonly StaffEmployeeOption[];
  locale: Locale;
  copy: {
    active: string;
    inactive: string;
    statusActive: string;
    statusInactive: string;
    clients: string;
    employees: string;
    viewDetails: string;
  };
}>;

const GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-blue-600",
];

function nameGradient(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export function StaffInteractive({
  assignments,
  clients,
  employees,
  locale,
  copy,
}: StaffInteractiveProps) {
  const { open } = useDetailDrawer();
  const [viewMode, setViewMode] = useViewMode("staff", "grid");
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openAssignmentDrawer = useCallback(
    (assignment: StaffAssignmentListItem) => {
      const config: DrawerConfig = {
        title: assignment.employeeName,
        subtitle: assignment.clientName,
        icon: <User className="size-6" />,
        accentColor: assignment.isActive ? "secondary" : "warning",
        badge: {
          label: assignment.isActive ? copy.statusActive : copy.statusInactive,
          variant: assignment.isActive ? "success" : "neutral",
        },
        kpis: [
          {
            label: "Status",
            value: assignment.isActive ? "Aktiv" : "Inaktiv",
            color: assignment.isActive ? "text-emerald-600" : "text-gray-400",
          },
          {
            label: "Mitarbeiter",
            value: assignment.employeeName.split(" ")[0],
            color: "text-blue-600",
          },
          {
            label: "Kunde",
            value: assignment.clientName.split(" ")[0],
            color: "text-violet-600",
          },
        ],
        sections: [
          {
            label: "Verfügbarkeit & Schichten",
            content: (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCalendarEmployee({
                      id: assignment.employeeId,
                      name: assignment.employeeName,
                    })
                  }
                  className="bg-secondary text-on-secondary flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold shadow-sm transition hover:opacity-90"
                >
                  <CalendarDays className="size-5" />
                  Verfügbarkeit & Schichten (Nächster Monat)
                </button>
              </div>
            ),
          },
          {
            label: "Zuweisung bearbeiten / beenden",
            content: (
              <EndAssignmentForm
                assignmentId={assignment.id}
                copy={{
                  activeEnded: "Zuweisung beendet",
                  assignTitle: "Zuweisung",
                  clientLabel: "Kunde",
                  employeeLabel: "Mitarbeiter",
                  endAction: "Zuweisung beenden",
                  endDateLabel: "Enddatum",
                  error: "Fehler beim Beenden der Zuweisung",
                  fieldError: "Ungültige Eingabe",
                  inactiveClient: "Inaktiver Kunde",
                  save: "Speichern",
                  saved: "Gespeichert",
                  startDateLabel: "Startdatum",
                  updateTitle: "Zuweisung bearbeiten",
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

  // Group by employee
  const byEmployee = assignments.reduce<
    Record<string, { name: string; items: StaffAssignmentListItem[] }>
  >((acc, a) => {
    if (!acc[a.employeeId])
      acc[a.employeeId] = { name: a.employeeName, items: [] };
    acc[a.employeeId].items.push(a);
    return acc;
  }, {});

  const employeeEntries = Object.entries(byEmployee);

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {assignments.length} Zuweisung{assignments.length !== 1 ? "en" : ""}
          {" · "}
          {employeeEntries.length} Mitarbeiter
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        /* ── Grid View: one card per employee ── */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employeeEntries.map(([empId, { name, items }]) => {
            const activeCount = items.filter((i) => i.isActive).length;
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const gradient = nameGradient(name);
            return (
              <div
                key={empId}
                className="border-outline-variant bg-surface-container-lowest hover:border-secondary flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-xl"
              >
                {/* Gradient header */}
                <Link
                  href={`/${locale}/admin/staff/${empId}`}
                  prefetch={false}
                  className={`flex flex-col items-center gap-3 bg-gradient-to-br ${gradient} group/header relative px-4 py-6`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
                    {initials}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white drop-shadow group-hover/header:underline">
                      {name}
                    </p>
                    <p className="mt-0.5 text-xs text-white/80">
                      {activeCount} aktiv · {items.length} gesamt
                    </p>
                  </div>
                </Link>

                {/* Employee detail + calendar availability buttons */}
                <div className="border-outline-variant bg-surface-container-low/40 grid gap-2 border-b p-3">
                  <Link
                    href={`/${locale}/admin/staff/${empId}`}
                    prefetch={false}
                    className="bg-secondary text-on-secondary flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-90"
                  >
                    <UserCircle2 className="size-4" />
                    {copy.viewDetails}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCalendarEmployee({ id: empId, name })
                    }
                    className="bg-secondary/10 hover:bg-secondary/20 text-secondary flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition"
                  >
                    <CalendarDays className="size-4" />
                    Verfügbarkeit & Schichten (Nächster Monat)
                  </button>
                </div>

                {/* Assignment list */}
                <div className="divide-outline-variant flex-1 divide-y">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="group hover:bg-surface-container flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors"
                      onClick={() => openAssignmentDrawer(a)}
                    >
                      <Building2 className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface group-hover:text-secondary truncate text-xs font-semibold transition-colors">
                          {a.clientName}
                        </p>
                        <p className="text-on-surface-variant flex items-center gap-1 text-xs">
                          <Clock className="size-3" />
                          {formatDate(a.startDate, locale)}
                        </p>
                      </div>
                      <span
                        className={
                          a.isActive
                            ? "bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                            : "bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                        }
                      >
                        {a.isActive ? copy.active : copy.inactive}
                      </span>
                    </button>
                  ))}
                </div>
                <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="grid gap-4">
          {employeeEntries.map(([empId, { name, items }]) => {
            const gradient = nameGradient(name);
            return (
              <div
                key={empId}
                className="border-outline-variant bg-surface-container-lowest overflow-hidden rounded-xl border shadow-sm"
              >
                <div
                  className={`bg-gradient-to-r ${gradient} flex items-center justify-between px-4 py-3`}
                >
                  <Link
                    href={`/${locale}/admin/staff/${empId}`}
                    className="group/header flex min-w-0 items-center gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-sm font-bold text-white backdrop-blur-sm">
                      {name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white drop-shadow group-hover/header:underline">
                        {name}
                      </p>
                      <p className="text-xs text-white/80">
                        {items.filter((i) => i.isActive).length} aktive
                        Zuweisung(en)
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/${locale}/admin/staff/${empId}`}
                      className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                    >
                      <UserCircle2 className="size-3.5" /> {copy.viewDetails}
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCalendarEmployee({ id: empId, name })
                      }
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                    >
                      <CalendarDays className="size-3.5" /> Verfügbarkeit
                    </button>
                  </div>
                </div>
                <div className="divide-outline-variant divide-y">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      className="group hover:bg-surface-container flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors"
                      onClick={() => openAssignmentDrawer(a)}
                      type="button"
                    >
                      <Building2 className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface group-hover:text-secondary truncate text-sm font-medium transition-colors">
                          {a.clientName}
                        </p>
                        <p className="text-on-surface-variant flex items-center gap-1 text-xs">
                          <Clock className="size-3" />
                          {formatDate(a.startDate, locale)}
                          {a.endDate
                            ? ` – ${formatDate(a.endDate, locale)}`
                            : " – Aktiv"}
                        </p>
                      </div>
                      <span
                        className={
                          a.isActive
                            ? "bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-xs font-bold"
                            : "bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 text-xs font-bold"
                        }
                      >
                        {a.isActive ? copy.active : copy.inactive}
                      </span>
                      <ArrowRight className="text-on-surface-variant size-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Availability & Shift Calendar Modal */}
      {selectedCalendarEmployee && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md duration-200">
          <div className="bg-surface-container-lowest border-outline-variant my-8 w-full max-w-5xl space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="border-outline-variant/60 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-secondary size-5" />
                <h2 className="font-heading text-primary-container text-xl font-bold">
                  Mitarbeiter Verfügbarkeit & Schichten
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarEmployee(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer rounded-full p-2 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <EmployeeAvailabilityCalendar
              employeeId={selectedCalendarEmployee.id}
              employeeName={selectedCalendarEmployee.name}
              clients={clients}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
