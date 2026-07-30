"use client";

import { CalendarDays, User, Building2, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
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
        ],
      };
      open(config);
    },
    [open, locale, copy],
  );

  // Group assignments by employee
  const byEmployee = assignments.reduce<
    Record<string, { name: string; items: StaffAssignmentListItem[] }>
  >((acc, a) => {
    if (!acc[a.employeeId]) {
      acc[a.employeeId] = { name: a.employeeName, items: [] };
    }
    acc[a.employeeId].items.push(a);
    return acc;
  }, {});

  return (
    <div className="grid gap-4">
      {Object.entries(byEmployee).map(([empId, { name, items }]) => (
        <div
          key={empId}
          className="border-outline-variant bg-surface-container-lowest rounded-lg border overflow-hidden"
        >
          {/* Employee header */}
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

          {/* Assignment rows */}
          <div className="divide-outline-variant divide-y">
            {items.map((a) => (
              <button
                key={a.id}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container"
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
  );
}
