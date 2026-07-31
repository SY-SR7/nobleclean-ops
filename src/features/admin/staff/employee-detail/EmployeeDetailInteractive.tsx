"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";

import { AvatarUpload, InlineEditField, useToast } from "@/components/ui";
import type { Locale } from "@/i18n/routing";

import {
  setWeeklyAvailabilityAction,
  updateEmployeeProfileAction,
  setDefaultDailyHoursAction,
} from "./actions";
import {
  initialWeeklyAvailabilityActionState,
} from "./schema";
import type {
  EmployeeAssignmentHistoryItem,
  EmployeeDetailData,
  EmployeeRecentPlanItem,
  EmployeeWeeklyAvailabilityDay,
} from "./queries";

export type EmployeeDetailCopy = Readonly<{
  title: string;
  backToStaff: string;
  profileTitle: string;
  fullNameLabel: string;
  roleLabel: string;
  roleAdmin: string;
  roleEmployee: string;
  saveProfile: string;
  profileSaved: string;
  profileError: string;
  defaultDailyHoursLabel: string;
  defaultDailyHoursSaved: string;
  defaultDailyHoursError: string;
  defaultDailyHoursHint: string;
  avatarChangeLabel: string;
  avatarUploadLabel: string;
  avatarSavedLabel: string;
  avatarErrorLabel: string;
  availabilityTitle: string;
  availabilityHint: string;
  weekdayLabels: readonly string[];
  available: string;
  unavailable: string;
  assignmentHistoryTitle: string;
  emptyAssignmentHistory: string;
  recentPlansTitle: string;
  emptyRecentPlans: string;
  statusActive: string;
  statusInactive: string;
  planStatusInProgress: string;
  planStatusSubmitted: string;
  planItemsCompletedLabel: string;
  savedLabel: string;
  errorLabel: string;
}>;

type EmployeeDetailInteractiveProps = Readonly<{
  data: EmployeeDetailData;
  locale: Locale;
  copy: EmployeeDetailCopy;
}>;

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

/* Inline name editor — replaces the old EmployeeProfileForm */
function InlineNameField({
  employeeId,
  fullName,
  locale,
  copy,
}: Readonly<{
  employeeId: string;
  fullName: string;
  locale: Locale;
  copy: EmployeeDetailCopy;
}>) {
  const { toast } = useToast();

  async function handleSave(next: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("employeeId", employeeId);
    fd.append("fullName", next);
    const result = await updateEmployeeProfileAction(undefined, fd);
    if (result.status === "success") {
      toast(copy.savedLabel ?? copy.profileSaved, "success");
      return null;
    }
    toast(copy.errorLabel ?? copy.profileError, "error");
    return copy.profileError;
  }

  return (
    <div className="border-outline-variant bg-surface-container rounded-xl border px-4 py-3">
      <p className="text-on-surface-variant text-xs font-medium mb-1">
        {copy.fullNameLabel}
      </p>
      <InlineEditField value={fullName} onSave={handleSave} />
    </div>
  );
}

/* Inline daily hours editor — replaces DefaultDailyHoursForm */
function InlineDailyHoursField({
  employeeId,
  defaultDailyHours,
  locale,
  copy,
}: Readonly<{
  employeeId: string;
  defaultDailyHours: number | null;
  locale: Locale;
  copy: EmployeeDetailCopy;
}>) {
  const { toast } = useToast();

  async function handleSave(next: string): Promise<string | null> {
    const num = parseFloat(next);
    if (next !== "" && (Number.isNaN(num) || num < 0.5 || num > 24)) {
      return copy.defaultDailyHoursError;
    }
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("employeeId", employeeId);
    fd.append("defaultDailyHours", next);
    const result = await setDefaultDailyHoursAction(undefined, fd);
    if (result.status === "success") {
      toast(copy.savedLabel ?? copy.defaultDailyHoursSaved, "success");
      return null;
    }
    toast(copy.errorLabel ?? copy.defaultDailyHoursError, "error");
    return copy.defaultDailyHoursError;
  }

  return (
    <div className="border-outline-variant bg-surface-container rounded-xl border px-4 py-3">
      <p className="text-on-surface-variant text-xs font-medium mb-1">
        {copy.defaultDailyHoursLabel}
      </p>
      <InlineEditField
        value={defaultDailyHours?.toString() ?? ""}
        placeholder="—"
        onSave={handleSave}
      />
      <p className="text-on-surface-variant text-xs mt-1">{copy.defaultDailyHoursHint}</p>
    </div>
  );
}

function WeekdayToggle({
  employeeId,
  locale,
  day,
  label,
  copy,
}: Readonly<{
  employeeId: string;
  locale: Locale;
  day: EmployeeWeeklyAvailabilityDay;
  label: string;
  copy: EmployeeDetailCopy;
}>) {
  const [state, formAction, isPending] = useActionState(
    setWeeklyAvailabilityAction,
    initialWeeklyAvailabilityActionState,
  );

  return (
    <form
      action={formAction}
      className="border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
    >
      <input name="locale" type="hidden" value={locale} />
      <input name="employeeId" type="hidden" value={employeeId} />
      <input name="weekday" type="hidden" value={day.weekday} />
      <input
        name="isAvailable"
        type="hidden"
        value={(!day.isAvailable).toString()}
      />

      <span className="text-on-surface text-sm font-semibold">{label}</span>

      <button
        aria-pressed={day.isAvailable}
        className={[
          "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition",
          day.isAvailable
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-surface-container text-on-surface-variant",
        ].join(" ")}
        disabled={isPending}
        formAction={formAction}
        type="submit"
      >
        {day.isAvailable ? copy.available : copy.unavailable}
      </button>
      {state.status === "error" && (
        <span className="sr-only" role="alert">
          {copy.profileError}
        </span>
      )}
    </form>
  );
}

function AssignmentHistoryList({
  items,
  copy,
  locale,
}: Readonly<{
  items: readonly EmployeeAssignmentHistoryItem[];
  copy: EmployeeDetailCopy;
  locale: Locale;
}>) {
  if (items.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptyAssignmentHistory}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <Building2 className="text-on-surface-variant size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              className="text-on-surface hover:text-secondary truncate text-sm font-semibold transition-colors"
              href={`/${locale}/admin?tab=clients&clientId=${item.clientId}`}
            >
              {item.clientName}
            </Link>
            <p className="text-on-surface-variant text-xs">
              {formatDate(item.startDate, locale)}
              {" – "}
              {item.endDate
                ? formatDate(item.endDate, locale)
                : copy.statusActive}
            </p>
          </div>
          <span
            className={
              item.isActive
                ? "bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                : "bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            }
          >
            {item.isActive ? copy.statusActive : copy.statusInactive}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentPlansList({
  items,
  copy,
  locale,
}: Readonly<{
  items: readonly EmployeeRecentPlanItem[];
  copy: EmployeeDetailCopy;
  locale: Locale;
}>) {
  if (items.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptyRecentPlans}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <ClipboardList className="text-on-surface-variant size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-on-surface truncate text-sm font-semibold">
              {item.clientName}
            </p>
            <p className="text-on-surface-variant text-xs">
              {formatDate(item.workDate, locale)}
              {" · "}
              {copy.planItemsCompletedLabel
                .replace("{completed}", String(item.completedItems))
                .replace("{total}", String(item.totalItems))}
            </p>
          </div>
          <span
            className={
              item.status === "submitted"
                ? "bg-secondary-container text-on-secondary-container shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                : "bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            }
          >
            {item.status === "submitted"
              ? copy.planStatusSubmitted
              : copy.planStatusInProgress}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EmployeeDetailInteractive({
  data,
  locale,
  copy,
}: EmployeeDetailInteractiveProps) {
  if (!data.employee) {
    return null;
  }

  const { employee } = data;

  return (
    <div className="grid gap-6">
      <div>
        <Link
          className="text-on-surface-variant hover:text-secondary inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          href={`/${locale}/admin?tab=staff`}
        >
          <ArrowLeft className="size-4" />
          {copy.backToStaff}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <AvatarUpload
          currentAvatarPath={employee.avatarPath}
          entityId={employee.id}
          entityName={employee.fullName}
          locale={locale}
          variant="employee"
          copy={{
            changeLabel: copy.avatarChangeLabel,
            uploadLabel: copy.avatarUploadLabel,
            savedLabel: copy.avatarSavedLabel,
            errorLabel: copy.avatarErrorLabel,
          }}
        />
        <div className="min-w-0 flex-1">
          <InlineEditField
            value={employee.fullName}
            displayClassName="font-heading text-primary-container text-2xl font-bold"
            onSave={async (next) => {
              const fd = new FormData();
              fd.append("locale", locale);
              fd.append("employeeId", employee.id);
              fd.append("fullName", next);
              const result = await updateEmployeeProfileAction(undefined, fd);
              if (result.status === "success") return null;
              return copy.profileError;
            }}
          />
          <p className="text-on-surface-variant text-sm mt-0.5">
            {employee.role === "admin" ? copy.roleAdmin : copy.roleEmployee}
          </p>
        </div>
      </div>

      <section className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded-2xl border p-5">
        <h2 className="font-heading text-primary-container text-lg font-bold">
          {copy.profileTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <InlineNameField
            copy={copy}
            employeeId={employee.id}
            fullName={employee.fullName}
            locale={locale}
          />
          <InlineDailyHoursField
            copy={copy}
            defaultDailyHours={employee.defaultDailyHours}
            employeeId={employee.id}
            locale={locale}
          />
        </div>
      </section>

      <section className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded-2xl border p-5">
        <div>
          <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
            <CalendarCheck className="size-5" />
            {copy.availabilityTitle}
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            {copy.availabilityHint}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.weeklyAvailability.map((day) => (
            <WeekdayToggle
              copy={copy}
              day={day}
              employeeId={employee.id}
              key={day.weekday}
              label={copy.weekdayLabels[day.weekday]}
              locale={locale}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container text-lg font-bold">
          {copy.assignmentHistoryTitle}
        </h2>
        <AssignmentHistoryList
          copy={copy}
          items={data.assignmentHistory}
          locale={locale}
        />
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container text-lg font-bold">
          {copy.recentPlansTitle}
        </h2>
        <RecentPlansList copy={copy} items={data.recentPlans} locale={locale} />
      </section>
    </div>
  );
}
