"use client";

import { Power, RotateCcw, Save } from "lucide-react";
import { useActionState } from "react";

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

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      {mode === "update" && client ? (
        <input name="id" type="hidden" value={client.id} />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-primary-container text-lg font-bold">
          {mode === "create" ? copy.createTitle : copy.updateTitle}
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
        defaultValue={client?.name ?? ""}
      />
      <FormInput
        autoComplete="street-address"
        error={fieldError(state, "address", copy)}
        id={`${formIdPrefix}-address`}
        label={copy.addressLabel}
        maxLength={500}
        name="address"
        type="text"
        defaultValue={client?.address ?? ""}
      />
      <FormInput
        autoComplete="name"
        error={fieldError(state, "contactName", copy)}
        id={`${formIdPrefix}-contact-name`}
        label={copy.contactNameLabel}
        maxLength={160}
        name="contactName"
        type="text"
        defaultValue={client?.contactInfo.contactName ?? ""}
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
        defaultValue={client?.contactInfo.email ?? ""}
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
        defaultValue={client?.contactInfo.phone ?? ""}
      />
      <FormInput
        error={fieldError(state, "contactNotes", copy)}
        id={`${formIdPrefix}-contact-notes`}
        label={copy.contactNotesLabel}
        maxLength={500}
        name="contactNotes"
        type="text"
        defaultValue={client?.contactInfo.notes ?? ""}
      />

      {message ? (
        <p
          className={
            state.status === "success"
              ? "border-secondary bg-secondary-container text-on-secondary-container rounded border px-3 py-2 text-sm"
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
        {mode === "create" ? copy.createSubmit : copy.updateSubmit}
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
