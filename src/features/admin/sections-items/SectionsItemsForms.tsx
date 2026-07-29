"use client";

import { ImageUp, Save, Trash2 } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { useActionState } from "react";

import { Button, FormInput } from "@/components/ui";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

import {
  attachReferenceImageAction,
  createLeafItemAction,
  createSectionAction,
  deleteLeafItemAction,
  deleteSectionAction,
  updateLeafItemAction,
  updateSectionAction,
} from "./actions";
import type {
  LeafItemListItem,
  SectionOption,
  SectionTreeNode,
} from "./queries";
import {
  initialSectionsItemsActionState,
  type EntityKind,
  type SectionsItemsActionState,
  type SectionsItemsField,
} from "./schema";

export type SectionsItemsFormCopy = Readonly<{
  attachImage: string;
  createLeafTitle: string;
  createSectionTitle: string;
  deleteLeaf: string;
  deleteSection: string;
  editLeafTitle: string;
  editSectionTitle: string;
  estimatedMinutesLabel: string;
  fieldError: string;
  imageAttached: string;
  imageLabel: string;
  leafNameLabel: string;
  parentSectionLabel: string;
  quantityLabel: string;
  recurrenceDaysLabel: string;
  rootParent: string;
  save: string;
  saved: string;
  saveError: string;
  sectionLabel: string;
  sectionNameLabel: string;
  sortOrderLabel: string;
  tagComplaint: string;
  tagHighPriority: string;
  tagLabel: string;
  tagNormal: string;
}>;

type SectionFormProps = Readonly<{
  clientId: string;
  copy: SectionsItemsFormCopy;
  locale: Locale;
  mode: "create" | "update";
  section?: SectionTreeNode;
  sectionOptions: readonly SectionOption[];
}>;

type LeafItemFormProps = Readonly<{
  clientId: string;
  copy: SectionsItemsFormCopy;
  leafItem?: LeafItemListItem;
  locale: Locale;
  mode: "create" | "update";
  sectionOptions: readonly SectionOption[];
  selectedSectionId: string;
}>;

type DeleteEntityFormProps = Readonly<{
  clientId: string;
  copy: SectionsItemsFormCopy;
  entityId: string;
  kind: EntityKind;
  locale: Locale;
}>;

type ReferenceImageFormProps = Readonly<{
  clientId: string;
  copy: SectionsItemsFormCopy;
  entityId: string;
  kind: EntityKind;
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

function messageForState(
  state: SectionsItemsActionState,
  copy: SectionsItemsFormCopy,
) {
  if (state.status === "success") {
    return state.code === "IMAGE_ATTACHED" ? copy.imageAttached : copy.saved;
  }

  if (state.status === "error") {
    return copy.saveError;
  }

  return null;
}

function fieldError(
  state: SectionsItemsActionState,
  field: SectionsItemsField,
  copy: SectionsItemsFormCopy,
) {
  return state.fieldErrors?.[field] ? copy.fieldError : undefined;
}

function Message({
  copy,
  state,
}: Readonly<{
  copy: SectionsItemsFormCopy;
  state: SectionsItemsActionState;
}>) {
  const message = messageForState(state, copy);

  if (!message) {
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
      {message}
    </p>
  );
}

function sectionOptionLabel(option: SectionOption) {
  return `${"  ".repeat(option.depth)}${option.name}`;
}

export function SectionForm({
  clientId,
  copy,
  locale,
  mode,
  section,
  sectionOptions,
}: SectionFormProps) {
  const action = mode === "create" ? createSectionAction : updateSectionAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialSectionsItemsActionState,
  );
  const parentOptions = section
    ? sectionOptions.filter((option) => option.id !== section.id)
    : sectionOptions;
  const formIdPrefix =
    mode === "create" ? "new-section" : `section-${section?.id}`;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="clientId" type="hidden" value={clientId} />
      <input name="locale" type="hidden" value={locale} />
      {section ? <input name="id" type="hidden" value={section.id} /> : null}

      <h2 className="font-heading text-primary-container text-lg font-bold">
        {mode === "create" ? copy.createSectionTitle : copy.editSectionTitle}
      </h2>

      <FormInput
        error={fieldError(state, "name", copy)}
        id={`${formIdPrefix}-name`}
        label={copy.sectionNameLabel}
        maxLength={160}
        name="name"
        required
        type="text"
        defaultValue={section?.name ?? ""}
      />
      <SelectField
        defaultValue={section?.parentSectionId ?? ""}
        error={fieldError(state, "parentSectionId", copy)}
        id={`${formIdPrefix}-parent`}
        label={copy.parentSectionLabel}
        name="parentSectionId"
      >
        <option value="">{copy.rootParent}</option>
        {parentOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {sectionOptionLabel(option)}
          </option>
        ))}
      </SelectField>
      <FormInput
        error={fieldError(state, "sortOrder", copy)}
        id={`${formIdPrefix}-sort-order`}
        inputMode="numeric"
        label={copy.sortOrderLabel}
        min={0}
        name="sortOrder"
        required
        type="number"
        defaultValue={section?.sortOrder ?? 0}
      />

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

export function LeafItemForm({
  clientId,
  copy,
  leafItem,
  locale,
  mode,
  sectionOptions,
  selectedSectionId,
}: LeafItemFormProps) {
  const action =
    mode === "create" ? createLeafItemAction : updateLeafItemAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialSectionsItemsActionState,
  );
  const formIdPrefix = mode === "create" ? "new-leaf" : `leaf-${leafItem?.id}`;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="clientId" type="hidden" value={clientId} />
      <input name="locale" type="hidden" value={locale} />
      {leafItem ? <input name="id" type="hidden" value={leafItem.id} /> : null}

      <h2 className="font-heading text-primary-container text-lg font-bold">
        {mode === "create" ? copy.createLeafTitle : copy.editLeafTitle}
      </h2>

      <SelectField
        defaultValue={leafItem?.sectionId ?? selectedSectionId}
        error={fieldError(state, "sectionId", copy)}
        id={`${formIdPrefix}-section`}
        label={copy.sectionLabel}
        name="sectionId"
        required
      >
        {sectionOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {sectionOptionLabel(option)}
          </option>
        ))}
      </SelectField>
      <FormInput
        error={fieldError(state, "name", copy)}
        id={`${formIdPrefix}-name`}
        label={copy.leafNameLabel}
        maxLength={160}
        name="name"
        required
        type="text"
        defaultValue={leafItem?.name ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormInput
          error={fieldError(state, "quantity", copy)}
          id={`${formIdPrefix}-quantity`}
          inputMode="numeric"
          label={copy.quantityLabel}
          max={999}
          min={1}
          name="quantity"
          required
          type="number"
          defaultValue={leafItem?.quantity ?? 1}
        />
        <FormInput
          error={fieldError(state, "estimatedMinutes", copy)}
          id={`${formIdPrefix}-estimated-minutes`}
          inputMode="numeric"
          label={copy.estimatedMinutesLabel}
          max={1440}
          min={1}
          name="estimatedMinutes"
          required
          type="number"
          defaultValue={leafItem?.estimatedMinutes ?? 1}
        />
        <FormInput
          error={fieldError(state, "recurrenceDays", copy)}
          id={`${formIdPrefix}-recurrence-days`}
          inputMode="numeric"
          label={copy.recurrenceDaysLabel}
          max={3650}
          min={1}
          name="recurrenceDays"
          type="number"
          defaultValue={leafItem?.recurrenceDays ?? ""}
        />
      </div>
      <SelectField
        defaultValue={leafItem?.tag ?? "normal"}
        error={fieldError(state, "tag", copy)}
        id={`${formIdPrefix}-tag`}
        label={copy.tagLabel}
        name="tag"
        required
      >
        <option value="normal">{copy.tagNormal}</option>
        <option value="complaint">{copy.tagComplaint}</option>
        <option value="high_priority">{copy.tagHighPriority}</option>
      </SelectField>

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

export function DeleteEntityForm({
  clientId,
  copy,
  entityId,
  kind,
  locale,
}: DeleteEntityFormProps) {
  const action =
    kind === "section" ? deleteSectionAction : deleteLeafItemAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialSectionsItemsActionState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="clientId" type="hidden" value={clientId} />
      <input name="id" type="hidden" value={entityId} />
      <input name="locale" type="hidden" value={locale} />
      <Button
        icon={<Trash2 aria-hidden="true" />}
        isLoading={isPending}
        size="sm"
        type="submit"
        variant="danger"
      >
        {kind === "section" ? copy.deleteSection : copy.deleteLeaf}
      </Button>
      {state.status === "error" ? (
        <p className="text-error text-xs font-semibold">{copy.saveError}</p>
      ) : null}
    </form>
  );
}

export function ReferenceImageForm({
  clientId,
  copy,
  entityId,
  kind,
  locale,
}: ReferenceImageFormProps) {
  const [state, formAction, isPending] = useActionState(
    attachReferenceImageAction,
    initialSectionsItemsActionState,
  );
  const inputId = `${kind}-${entityId}-reference-image`;

  return (
    <form
      action={formAction}
      className="grid gap-3"
      encType="multipart/form-data"
    >
      <input name="clientId" type="hidden" value={clientId} />
      <input name="entityId" type="hidden" value={entityId} />
      <input name="entityKind" type="hidden" value={kind} />
      <input name="locale" type="hidden" value={locale} />
      <label
        className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
        htmlFor={inputId}
      >
        {copy.imageLabel}
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="border-outline-variant bg-surface-container-lowest text-on-surface file:bg-secondary file:text-on-secondary rounded border text-sm file:mr-3 file:h-10 file:border-0 file:px-3 file:text-xs file:font-bold file:tracking-normal file:uppercase"
        id={inputId}
        name="referenceImage"
        required
        type="file"
      />
      <Message copy={copy} state={state} />
      <Button
        icon={<ImageUp aria-hidden="true" />}
        isLoading={isPending}
        size="sm"
        type="submit"
        variant="secondary"
      >
        {copy.attachImage}
      </Button>
    </form>
  );
}
