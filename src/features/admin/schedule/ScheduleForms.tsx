"use client";

import { Save, Trash2 } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { useActionState } from "react";

import { Button, FormInput, FormSelect } from "@/components/ui";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "./actions";
import type {
  ScheduleClientOption,
  ScheduleEmployeeOption,
  ScheduleListItem,
} from "./queries";
import {
  initialScheduleActionState,
  type ScheduleActionState,
  type ScheduleField,
} from "./schema";

export type ScheduleCopy = Readonly<{
  allocatedHoursLabel: string;
  clientLabel: string;
  createTitle: string;
  deleteAction: string;
  deleted: string;
  employeeLabel: string;
  error: string;
  fieldError: string;
  inactiveClient: string;
  save: string;
  saved: string;
  updateTitle: string;
  workDateLabel: string;
}>;

type ScheduleFormProps = Readonly<{
  clients: readonly ScheduleClientOption[];
  copy: ScheduleCopy;
  employees: readonly ScheduleEmployeeOption[];
  locale: Locale;
  mode: "create" | "update";
  schedule?: ScheduleListItem;
}>;

type DeleteScheduleFormProps = Readonly<{
  copy: ScheduleCopy;
  locale: Locale;
  scheduleId: string;
}>;

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> &
  Readonly<{
    children: ReactNode;
    error?: ReactNode;
    id: string;
    label: ReactNode;
  }>;

const SelectField = FormSelect;

function fieldError(
  state: ScheduleActionState,
  field: ScheduleField,
  copy: ScheduleCopy,
) {
  return state.fieldErrors?.[field] ? copy.fieldError : undefined;
}

function Message({
  copy,
  state,
}: Readonly<{
  copy: ScheduleCopy;
  state: ScheduleActionState;
}>) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "border-secondary bg-secondary-container text-on-secondary-container rounded border px-3 py-2 text-sm"
          : "border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm"
      }
    >
      {state.status === "success"
        ? state.code === "DELETED"
          ? copy.deleted
          : copy.saved
        : copy.error}
    </p>
  );
}

export function ScheduleForm({
  clients,
  copy,
  employees,
  locale,
  mode,
  schedule,
}: ScheduleFormProps) {
  const action =
    mode === "create" ? createScheduleAction : updateScheduleAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialScheduleActionState,
  );
  const formIdPrefix = mode === "create" ? "new-schedule" : schedule?.id;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      {schedule ? <input name="id" type="hidden" value={schedule.id} /> : null}

      <h2 className="font-heading text-primary-container text-lg font-bold">
        {mode === "create" ? copy.createTitle : copy.updateTitle}
      </h2>

      <SelectField
        defaultValue={schedule?.employeeId ?? ""}
        error={fieldError(state, "employeeId", copy)}
        id={`${formIdPrefix}-employee`}
        label={copy.employeeLabel}
        name="employeeId"
        required
      >
        <option value="" />
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.fullName}
          </option>
        ))}
      </SelectField>

      <SelectField
        defaultValue={schedule?.clientId ?? ""}
        error={fieldError(state, "clientId", copy)}
        id={`${formIdPrefix}-client`}
        label={copy.clientLabel}
        name="clientId"
        required
      >
        <option value="" />
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.isActive
              ? client.name
              : `${client.name} (${copy.inactiveClient})`}
          </option>
        ))}
      </SelectField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          error={fieldError(state, "workDate", copy)}
          id={`${formIdPrefix}-work-date`}
          label={copy.workDateLabel}
          name="workDate"
          required
          type="date"
          defaultValue={schedule?.workDate ?? ""}
        />
        <FormInput
          error={fieldError(state, "allocatedHours", copy)}
          id={`${formIdPrefix}-allocated-hours`}
          inputMode="decimal"
          label={copy.allocatedHoursLabel}
          max={24}
          min={0.25}
          name="allocatedHours"
          required
          step={0.25}
          type="number"
          defaultValue={schedule?.allocatedHours ?? ""}
        />
      </div>

      <Message copy={copy} state={state} />
      <Button
        icon={<Save aria-hidden="true" />}
        isLoading={isPending}
        type="submit"
      >
        {copy.save}
      </Button>
    </form>
  );
}

export function DeleteScheduleForm({
  copy,
  locale,
  scheduleId,
}: DeleteScheduleFormProps) {
  const [state, formAction, isPending] = useActionState(
    deleteScheduleAction,
    initialScheduleActionState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="id" type="hidden" value={scheduleId} />
      <input name="locale" type="hidden" value={locale} />
      <Button
        icon={<Trash2 aria-hidden="true" />}
        isLoading={isPending}
        size="sm"
        type="submit"
        variant="danger"
      >
        {copy.deleteAction}
      </Button>
      {state.status !== "idle" ? <Message copy={copy} state={state} /> : null}
    </form>
  );
}
