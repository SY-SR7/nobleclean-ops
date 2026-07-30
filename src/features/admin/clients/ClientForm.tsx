"use client";

import { Power, RotateCcw, Save, Building2, MapPin, User, Mail, Phone, FileText } from "lucide-react";
import { useActionState, type ReactNode } from "react";

import { Button, FormInput } from "@/components/ui";
import type { Locale } from "@/i18n/routing";

import {
  createClientAction,
  setClientActiveAction,
  updateClientAction,
} from "./actions";
import {
  initialClientActionState,
  type ClientActionState,
  type ClientContactInfo,
  type ClientFormField,
} from "./schema";

export type ClientFormCopy = Readonly<{
  addressLabel: string;
  contactEmailLabel: string;
  contactNameLabel: string;
  contactNotesLabel: string;
  contactPhoneLabel: string;
  createSubmit: string;
  createTitle: string;
  errorMessage: string;
  fieldError: string;
  nameLabel: string;
  successCreated: string;
  successUpdated: string;
  updateSubmit: string;
  updateTitle: string;
}>;

export type ClientStatusCopy = Readonly<{
  deactivate: string;
  errorMessage: string;
  reactivate: string;
  success: string;
}>;

type ClientFormProps = Readonly<{
  client?: {
    address: string;
    contactInfo: ClientContactInfo;
    id: string;
    name: string;
  };
  copy: ClientFormCopy;
  formIdPrefix: string;
  locale: Locale;
  mode: "create" | "update";
}>;

type ClientStatusFormProps = Readonly<{
  clientId: string;
  copy: ClientStatusCopy;
  isActive: boolean;
  locale: Locale;
}>;

function messageForState(state: ClientActionState, copy: ClientFormCopy) {
  if (state.status === "success") {
    return state.code === "CLIENT_CREATED"
      ? copy.successCreated
      : copy.successUpdated;
  }
  if (state.status === "error") {
    return copy.errorMessage;
  }
  return null;
}

function fieldError(
  state: ClientActionState,
  field: ClientFormField,
  copy: ClientFormCopy,
) {
  return state.fieldErrors?.[field] ? copy.fieldError : undefined;
}

function EditableFieldCard({
  icon,
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  autoComplete,
  error,
}: {
  icon?: ReactNode;
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/80 p-3.5 transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 shadow-sm">
      <label className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1">
        {icon && <span className="text-secondary">{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-transparent font-semibold text-on-surface text-sm outline-none placeholder:text-on-surface-variant/40"
      />
      {error && <p className="text-error mt-1 text-xs font-semibold">{error}</p>}
    </div>
  );
}

export function ClientForm({
  client,
  copy,
  formIdPrefix,
  locale,
  mode,
}: ClientFormProps) {
  const action = mode === "create" ? createClientAction : updateClientAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialClientActionState,
  );
  const message = messageForState(state, copy);

  if (mode === "update" && client) {
    return (
      <form action={formAction} className="grid gap-4" noValidate>
        <input name="locale" type="hidden" value={locale} />
        <input name="id" type="hidden" value={client.id} />

        {message ? (
          <p
            className={
              state.status === "success"
                ? "bg-secondary-container text-on-secondary-container rounded-xl px-4 py-2.5 text-xs font-bold"
                : "bg-error-container text-on-error-container rounded-xl px-4 py-2.5 text-xs font-bold"
            }
          >
            {message}
          </p>
        ) : null}

        {/* Direct In-Place Editable Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <EditableFieldCard
            icon={<Building2 className="size-4" />}
            label={copy.nameLabel}
            name="name"
            defaultValue={client.name}
            error={fieldError(state, "name", copy)}
          />
          <EditableFieldCard
            icon={<MapPin className="size-4" />}
            label={copy.addressLabel}
            name="address"
            defaultValue={client.address}
            error={fieldError(state, "address", copy)}
          />
          <EditableFieldCard
            icon={<User className="size-4" />}
            label={copy.contactNameLabel}
            name="contactName"
            defaultValue={client.contactInfo.contactName}
            error={fieldError(state, "contactName", copy)}
          />
          <EditableFieldCard
            icon={<Mail className="size-4" />}
            label={copy.contactEmailLabel}
            name="contactEmail"
            type="email"
            defaultValue={client.contactInfo.email}
            error={fieldError(state, "contactEmail", copy)}
          />
          <EditableFieldCard
            icon={<Phone className="size-4" />}
            label={copy.contactPhoneLabel}
            name="contactPhone"
            defaultValue={client.contactInfo.phone}
            error={fieldError(state, "contactPhone", copy)}
          />
          <EditableFieldCard
            icon={<FileText className="size-4" />}
            label={copy.contactNotesLabel}
            name="contactNotes"
            defaultValue={client.contactInfo.notes ?? ""}
            error={fieldError(state, "contactNotes", copy)}
          />
        </div>

        <Button
          icon={<Save className="size-4" aria-hidden="true" />}
          isLoading={isPending}
          type="submit"
          className="w-full justify-center mt-1"
        >
          {copy.updateSubmit}
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-primary-container text-lg font-bold">
          {copy.createTitle}
        </h2>
      </div>

      <FormInput
        autoComplete="organization"
        error={fieldError(state, "name", copy)}
        id={`${formIdPrefix}-name`}
        label={copy.nameLabel}
        maxLength={120}
        name="name"
        required
        type="text"
      />
      <FormInput
        autoComplete="street-address"
        error={fieldError(state, "address", copy)}
        id={`${formIdPrefix}-address`}
        label={copy.addressLabel}
        maxLength={500}
        name="address"
        type="text"
      />
      <FormInput
        autoComplete="name"
        error={fieldError(state, "contactName", copy)}
        id={`${formIdPrefix}-contact-name`}
        label={copy.contactNameLabel}
        maxLength={160}
        name="contactName"
        type="text"
      />
      <FormInput
        autoComplete="email"
        error={fieldError(state, "contactEmail", copy)}
        id={`${formIdPrefix}-contact-email`}
        inputMode="email"
        label={copy.contactEmailLabel}
        maxLength={254}
        name="contactEmail"
        type="email"
      />
      <FormInput
        autoComplete="tel"
        error={fieldError(state, "contactPhone", copy)}
        id={`${formIdPrefix}-contact-phone`}
        inputMode="tel"
        label={copy.contactPhoneLabel}
        maxLength={80}
        name="contactPhone"
        type="tel"
      />
      <FormInput
        error={fieldError(state, "contactNotes", copy)}
        id={`${formIdPrefix}-contact-notes`}
        label={copy.contactNotesLabel}
        maxLength={500}
        name="contactNotes"
        type="text"
      />

      {message ? (
        <p
          className={
            state.status === "success"
              ? "border-secondary bg-secondary-container text-on-secondary-container rounded px-3 py-2 text-sm"
              : "border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm"
          }
        >
          {message}
        </p>
      ) : null}

      <Button
        icon={<Save aria-hidden="true" />}
        isLoading={isPending}
        type="submit"
      >
        {copy.createSubmit}
      </Button>
    </form>
  );
}

export function ClientStatusForm({
  clientId,
  copy,
  isActive,
  locale,
}: ClientStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    setClientActiveAction,
    initialClientActionState,
  );
  const nextIsActive = !isActive;

  return (
    <form action={formAction} className="grid gap-2">
      <input name="id" type="hidden" value={clientId} />
      <input name="locale" type="hidden" value={locale} />
      <input
        name="nextIsActive"
        type="hidden"
        value={nextIsActive ? "true" : "false"}
      />
      <Button
        icon={
          nextIsActive ? (
            <RotateCcw aria-hidden="true" />
          ) : (
            <Power aria-hidden="true" />
          )
        }
        isLoading={isPending}
        size="sm"
        type="submit"
        variant={nextIsActive ? "secondary" : "danger"}
      >
        {nextIsActive ? copy.reactivate : copy.deactivate}
      </Button>
      {state.status === "success" ? (
        <p className="text-secondary text-xs font-semibold">{copy.success}</p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-error text-xs font-semibold">{copy.errorMessage}</p>
      ) : null}
    </form>
  );
}
