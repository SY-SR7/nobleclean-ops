"use client";

import { CalendarDays, User, Building2, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig, InfoGrid } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { EndAssignmentForm } from "./StaffAssignmentForms";
import type { StaffAssignmentListItem, StaffClientOption, StaffEmployeeOption } from "./queries";
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
          { label: "Status", value: assignment.isActive ? "Aktiv" : "Inaktiv", color: assignment.isActive ? "text-emerald-600" : "text-gray-400" },
          { label: "Mitarbeiter", value: assignment.employeeName.split(" ")[0], color: "text-blue-600" },
          { label: "Kunde", value: assignment.clientName.split(" ")[0], color: "text-violet-600" },
        ],
        sections: [
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
    if (!acc[a.employeeId]) acc[a.employeeId] = { name: a.employeeName, items: [] };
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
            const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            const gradient = nameGradient(name);
            return (
              <div
                key={empId}
                className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:border-secondary hover:shadow-xl"
              >
                {/* Gradient header */}
                <div className={`flex flex-col items-center gap-3 bg-gradient-to-br ${gradient} px-4 py-6`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white font-bold text-2xl backdrop-blur-sm border border-white/30">
                    {initials}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm drop-shadow">{name}</p>
                    <p className="text-white/80 text-xs mt-0.5">
                      {activeCount} aktiv · {items.length} gesamt
                    </p>
                  </div>
                </div>
                {/* Assignment list */}
                <div className="divide-y divide-outline-variant">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container cursor-pointer"
                      onClick={() => openAssignmentDrawer(a)}
                    >
                      <Building2 className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface group-hover:text-secondary text-xs font-semibold truncate transition-colors">
                          {a.clientName}
                        </p>
                        <p className="text-on-surface-variant text-xs flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(a.startDate, locale)}
                        </p>
                      </div>
                      <span
                        className={
                          a.isActive
                            ? "shrink-0 bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-xs font-bold"
                            : "shrink-0 bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 text-xs font-bold"
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
                className="border-outline-variant bg-surface-container-lowest rounded-xl border overflow-hidden shadow-sm"
              >
                <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center gap-3`}>
                  <div className="bg-white/20 text-white flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm border border-white/30 backdrop-blur-sm">
                    {name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm drop-shadow">{name}</p>
                    <p className="text-white/80 text-xs">
                      {items.filter((i) => i.isActive).length} aktive Zuweisung(en)
                    </p>
                  </div>
                </div>
                <div className="divide-outline-variant divide-y">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container cursor-pointer"
                      onClick={() => openAssignmentDrawer(a)}
                      type="button"
                    >
                      <Building2 className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-on-surface group-hover:text-secondary text-sm font-medium truncate transition-colors">
                          {a.clientName}
                        </p>
                        <p className="text-on-surface-variant text-xs flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(a.startDate, locale)}
                          {a.endDate ? ` – ${formatDate(a.endDate, locale)}` : " – Aktiv"}
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
    </div>
  );
}
