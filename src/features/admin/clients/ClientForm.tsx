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
    <form action={formAction} className="space-y-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      
      <p className="text-xs text-on-surface-variant font-medium -mt-1 mb-3">
        Erstellen Sie ein neues Objekt mit Ansprechpartner und Standortdaten.
      </p>

      {/* Field 1: Client Name */}
      <div>
        <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
          <Building2 className="size-3.5 text-secondary" /> {copy.nameLabel} *
        </label>
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          autoComplete="organization"
          placeholder="z.B. Fitness First Hamburg"
          className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
        />
        {fieldError(state, "name", copy) && (
          <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "name", copy)}</p>
        )}
      </div>

      {/* Field 2: Contact Name */}
      <div>
        <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
          <User className="size-3.5 text-secondary" /> {copy.contactNameLabel}
        </label>
        <input
          type="text"
          name="contactName"
          maxLength={160}
          autoComplete="name"
          placeholder="z.B. Michael Schmidt"
          className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
        />
        {fieldError(state, "contactName", copy) && (
          <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "contactName", copy)}</p>
        )}
      </div>

      {/* Field 3 & 4: Email & Phone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
            <Mail className="size-3.5 text-secondary" /> {copy.contactEmailLabel}
          </label>
          <input
            type="email"
            name="contactEmail"
            maxLength={254}
            autoComplete="email"
            placeholder="kontakt@objekt.de"
            className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
          />
          {fieldError(state, "contactEmail", copy) && (
            <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "contactEmail", copy)}</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
            <Phone className="size-3.5 text-secondary" /> {copy.contactPhoneLabel}
          </label>
          <input
            type="tel"
            name="contactPhone"
            maxLength={80}
            autoComplete="tel"
            placeholder="+49 40 123456"
            className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
          />
          {fieldError(state, "contactPhone", copy) && (
            <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "contactPhone", copy)}</p>
          )}
        </div>
      </div>

      {/* Field 5: Address */}
      <div>
        <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
          <MapPin className="size-3.5 text-secondary" /> {copy.addressLabel}
        </label>
        <input
          type="text"
          name="address"
          maxLength={500}
          autoComplete="street-address"
          placeholder="Mönckebergstraße 10, 20095 Hamburg"
          className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
        />
        {fieldError(state, "address", copy) && (
          <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "address", copy)}</p>
        )}
      </div>

      {/* Field 6: Contact Notes */}
      <div>
        <label className="text-[10px] font-extrabold uppercase text-on-surface-variant flex items-center gap-1.5 mb-1">
          <FileText className="size-3.5 text-secondary" /> {copy.contactNotesLabel}
        </label>
        <input
          type="text"
          name="contactNotes"
          maxLength={500}
          placeholder="Zusätzliche Notizen zum Objekt..."
          className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none shadow-sm transition"
        />
        {fieldError(state, "contactNotes", copy) && (
          <p className="text-error mt-1 text-xs font-semibold">{fieldError(state, "contactNotes", copy)}</p>
        )}
      </div>

      {message ? (
        <p
          className={
            state.status === "success"
              ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs font-bold"
              : "bg-red-500/10 text-red-800 border border-red-500/20 rounded-xl px-4 py-2.5 text-xs font-bold"
          }
        >
          {message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/60">
        <Button
          icon={<Save className="size-4" aria-hidden="true" />}
          isLoading={isPending}
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-extrabold shadow-md hover:opacity-90 transition cursor-pointer"
        >
          Kunden anlegen & Speichern
        </Button>
      </div>
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
