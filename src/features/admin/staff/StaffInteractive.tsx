"use client";

import { CalendarDays, User, Building2, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
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
        icon: <User className="size-5" />,
        accentColor: assignment.isActive ? "secondary" : "warning",
        sections: [
          {
            label: "Status",
            content: (
              <div className="flex items-center gap-2">
                {assignment.isActive ? (
                  <CheckCircle2 className="text-status-success size-4 shrink-0" />
                ) : (
                  <XCircle className="text-on-surface-variant size-4 shrink-0" />
                )}
                <span className="text-sm font-semibold">
                  {assignment.isActive ? copy.statusActive : copy.statusInactive}
                </span>
              </div>
            ),
          },
          {
            label: "Zuweisung",
            content: (
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="text-secondary size-4 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.employees}
                    </p>
                    <p className="text-on-surface text-sm">{assignment.employeeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="text-secondary size-4 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.clients}
                    </p>
                    <p className="text-on-surface text-sm">{assignment.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-secondary size-4 shrink-0" />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      Zeitraum
                    </p>
                    <p className="text-on-surface text-sm">
                      {formatDate(assignment.startDate, locale)} –{" "}
                      {assignment.endDate
                        ? formatDate(assignment.endDate, locale)
                        : "Aktiv"}
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: "Zuweisung beenden",
            content: (
              <EndAssignmentForm
                assignmentId={assignment.id}
                copy={{
                  endDate: "Enddatum",
                  error: "Fehler beim Beenden der Zuweisung",
                  fieldError: "Ungültige Eingabe",
                  submit: "Zuweisung beenden",
                  success: "Zuweisung beendet",
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
    if (!acc[a.employeeId]) {
      acc[a.employeeId] = { name: a.employeeName, items: [] };
    }
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
            return (
              <div
                key={empId}
                className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:border-secondary hover:shadow-md"
              >
                {/* Employee header */}
                <div className="flex flex-col items-center gap-3 bg-surface-container px-4 py-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-on-secondary font-bold text-xl">
                    {initials}
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface font-bold text-sm">{name}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
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
                <div className="h-1 bg-secondary" />
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View: grouped by employee ── */
        <div className="grid gap-4">
          {employeeEntries.map(([empId, { name, items }]) => (
            <div
              key={empId}
              className="border-outline-variant bg-surface-container-lowest rounded-xl border overflow-hidden shadow-sm"
            >
              <div className="bg-surface-container px-4 py-3 flex items-center gap-3">
                <div className="bg-secondary text-on-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm">
                  {name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-on-surface font-semibold text-sm">{name}</p>
                  <p className="text-on-surface-variant text-xs">
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
          ))}
        </div>
      )}
    </div>
  );
}
