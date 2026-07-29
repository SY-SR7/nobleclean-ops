"use client";

import { Save, UserMinus } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { useActionState } from "react";

import { Button, FormInput } from "@/components/ui";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

import {
  createStaffAssignmentAction,
  endStaffAssignmentAction,
  updateStaffAssignmentAction,
} from "./actions";
import type {
  StaffAssignmentListItem,
  StaffClientOption,
  StaffEmployeeOption,
} from "./queries";
import {
  initialStaffAssignmentActionState,
  type StaffAssignmentActionState,
  type StaffAssignmentField,
} from "./schema";

export type StaffAssignmentCopy = Readonly<{
  activeEnded: string;
  assignTitle: string;
  clientLabel: string;
  employeeLabel: string;
  endAction: string;
  endDateLabel: string;
  error: string;
  fieldError: string;
  inactiveClient: string;
  save: string;
  saved: string;
  startDateLabel: string;
  updateTitle: string;
}>;

type AssignmentFormProps = Readonly<{
  assignment?: StaffAssignmentListItem;
  clients: readonly StaffClientOption[];
  copy: StaffAssignmentCopy;
  employees: readonly StaffEmployeeOption[];
  locale: Locale;
  mode: "create" | "update";
}>;

type EndAssignmentFormProps = Readonly<{
  assignmentId: string;
  copy: StaffAssignmentCopy;
  locale: Locale;
}>;

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> &
  Readonly<{
    children: ReactNode;
    error?: ReactNode;
    id: string;
    label: ReactNode;
  }>;

function SelectField({
  children,
  className,
  error,
  id,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <div className="grid gap-2">
      <label
        className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        aria-invalid={error ? true : undefined}
        className={cn(
          "border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none",
          error ? "border-error" : undefined,
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-error text-sm">{error}</p> : null}
    </div>
  );
}

function fieldError(
  state: StaffAssignmentActionState,
  field: StaffAssignmentField,
  copy: StaffAssignmentCopy,
) {
  return state.fieldErrors?.[field] ? copy.fieldError : undefined;
}

function Message({
  copy,
  state,
}: Readonly<{
  copy: StaffAssignmentCopy;
  state: StaffAssignmentActionState;
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
        ? state.code === "ENDED"
          ? copy.activeEnded
          : copy.saved
        : copy.error}
    </p>
  );
}

export function StaffAssignmentForm({
  assignment,
  clients,
  copy,
  employees,
  locale,
  mode,
}: AssignmentFormProps) {
  const action =
    mode === "create"
      ? createStaffAssignmentAction
      : updateStaffAssignmentAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialStaffAssignmentActionState,
  );
  const formIdPrefix = mode === "create" ? "new-assignment" : assignment?.id;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      {assignment ? (
        <input name="id" type="hidden" value={assignment.id} />
      ) : null}

      <h2 className="font-heading text-primary-container text-lg font-bold">
        {mode === "create" ? copy.assignTitle : copy.updateTitle}
      </h2>

      <SelectField
        defaultValue={assignment?.employeeId ?? ""}
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
        defaultValue={assignment?.clientId ?? ""}
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
          error={fieldError(state, "startDate", copy)}
          id={`${formIdPrefix}-start-date`}
          label={copy.startDateLabel}
          name="startDate"
          required
          type="date"
          defaultValue={assignment?.startDate ?? ""}
        />
        <FormInput
          error={fieldError(state, "endDate", copy)}
          id={`${formIdPrefix}-end-date`}
          label={copy.endDateLabel}
          name="endDate"
          type="date"
          defaultValue={assignment?.endDate ?? ""}
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

export function EndAssignmentForm({
  assignmentId,
  copy,
  locale,
}: EndAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    endStaffAssignmentAction,
    initialStaffAssignmentActionState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="id" type="hidden" value={assignmentId} />
      <input name="locale" type="hidden" value={locale} />
      <Button
        icon={<UserMinus aria-hidden="true" />}
        isLoading={isPending}
        size="sm"
        type="submit"
        variant="danger"
      >
        {copy.endAction}
      </Button>
      {state.status !== "idle" ? <Message copy={copy} state={state} /> : null}
    </form>
  );
}
