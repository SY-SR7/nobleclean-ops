"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, useCallback } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  Layers,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";

import type { Locale } from "@/i18n/routing";
import {
  AvatarUpload,
  EntityLink,
  InlineEditField,
  InlineStatusToggle,
  ConfirmDeleteModal,
  useToast,
} from "@/components/ui";
import type {
  ClientAssignedEmployee,
  ClientDetailData,
  ClientRecentPlan,
  ClientSectionSummary,
} from "./queries";
import {
  updateClientNameAction,
  updateClientAddressAction,
  updateClientContactFieldAction,
  toggleClientStatusAction,
  endClientAssignmentAction,
  addClientAssignmentAction,
} from "./actions";

/* ─────────────────────────────────────────────────────────────────────────
   Copy type
   ───────────────────────────────────────────────────────────────────────── */
export type ClientDetailCopy = Readonly<{
  backToClients: string;
  profileTitle: string;
  addressLabel: string;
  contactNameLabel: string;
  contactEmailLabel: string;
  contactPhoneLabel: string;
  contactNotesLabel: string;
  statusActive: string;
  statusInactive: string;
  avatarChangeLabel: string;
  avatarUploadLabel: string;
  avatarSavedLabel: string;
  avatarErrorLabel: string;
  assignedEmployeesTitle: string;
  emptyAssignedEmployees: string;
  recentPlansTitle: string;
  emptyRecentPlans: string;
  sectionsTitle: string;
  emptySections: string;
  planStatusInProgress: string;
  planStatusSubmitted: string;
  planItemsCompletedLabel: string;
  notAvailable: string;
  viewEmployee: string;
  rootSection: string;
  savedLabel: string;
  errorLabel: string;
  endAssignmentLabel: string;
  endAssignmentConfirmTitle: string;
  endAssignmentConfirmBody: string;
  confirmLabel: string;
  cancelLabel: string;
  addAssignmentLabel: string;
  employeeLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  saveLabel: string;
  employees: readonly { id: string; fullName: string }[];
}>;

type ClientDetailInteractiveProps = Readonly<{
  data: ClientDetailData;
  locale: Locale;
  copy: ClientDetailCopy;
}>;

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────── */
function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

/* ─────────────────────────────────────────────────────────────────────────
   ProfileSection — all fields editable inline
   ───────────────────────────────────────────────────────────────────────── */
function ProfileSection({
  client,
  locale,
  copy,
}: Readonly<{
  client: ClientDetailData["client"];
  locale: Locale;
  copy: ClientDetailCopy;
}>) {
  const { toast } = useToast();
  if (!client) return null;

  async function saveField(
    action: (fd: FormData) => Promise<{ ok: boolean }>,
    fields: Record<string, string>,
  ): Promise<string | null> {
    const result = await action(makeFormData(fields));
    if (result.ok) {
      toast(copy.savedLabel, "success");
      return null;
    }
    toast(copy.errorLabel, "error");
    return copy.errorLabel;
  }

  const contactFields: {
    key: "contactName" | "email" | "phone" | "notes";
    label: string;
    icon: React.ReactNode;
    value: string;
    multiline?: boolean;
  }[] = [
    {
      key: "contactName",
      label: copy.contactNameLabel,
      icon: <User className="size-4" />,
      value: client.contactName,
    },
    {
      key: "email",
      label: copy.contactEmailLabel,
      icon: <Mail className="size-4" />,
      value: client.contactEmail,
    },
    {
      key: "phone",
      label: copy.contactPhoneLabel,
      icon: <Phone className="size-4" />,
      value: client.contactPhone,
    },
    {
      key: "notes",
      label: copy.contactNotesLabel,
      icon: <MapPin className="size-4" />,
      value: client.contactNotes,
      multiline: true,
    },
  ];

  return (
    <section className="border-outline-variant bg-surface-container-lowest grid gap-4 rounded-2xl border p-5">
      <h2 className="font-heading text-primary-container text-lg font-bold">
        {copy.profileTitle}
      </h2>

      {/* Address */}
      <div className="border-outline-variant bg-surface-container flex items-start gap-3 rounded-xl border px-4 py-3">
        <span className="text-on-surface-variant mt-0.5 shrink-0">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-on-surface-variant text-xs font-medium mb-1">
            {copy.addressLabel}
          </p>
          <InlineEditField
            value={client.address}
            placeholder="—"
            onSave={(val) =>
              saveField(updateClientAddressAction, {
                clientId: client.id,
                locale,
                address: val,
              })
            }
          />
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        {contactFields.map((field) => (
          <div
            key={field.key}
            className="border-outline-variant bg-surface-container flex items-start gap-3 rounded-xl border px-4 py-3"
          >
            <span className="text-on-surface-variant mt-0.5 shrink-0">
              {field.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-on-surface-variant text-xs font-medium mb-1">
                {field.label}
              </p>
              <InlineEditField
                value={field.value}
                placeholder="—"
                multiline={field.multiline}
                onSave={(val) =>
                  saveField(updateClientContactFieldAction, {
                    clientId: client.id,
                    locale,
                    field: field.key,
                    value: val,
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AddAssignmentForm
   ───────────────────────────────────────────────────────────────────────── */
function AddAssignmentForm({
  clientId,
  locale,
  copy,
  onClose,
}: Readonly<{
  clientId: string;
  locale: Locale;
  copy: ClientDetailCopy;
  onClose: () => void;
}>) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(
    addClientAssignmentAction,
    null,
  );

  // Close + toast on success
  if (state?.ok) {
    toast(copy.savedLabel, "success");
    onClose();
  }

  return (
    <form
      action={formAction}
      className="border-outline-variant bg-surface-container-low rounded-2xl border p-4 grid gap-3"
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-on-surface">{copy.addAssignmentLabel}</p>
        <button
          type="button"
          onClick={onClose}
          className="size-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Employee select */}
      <div className="border-outline-variant bg-surface-container-lowest rounded-xl border px-3 py-2">
        <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">
          {copy.employeeLabel}
        </label>
        <select
          name="employeeId"
          required
          className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none"
        >
          <option value="">—</option>
          {copy.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Start date */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border-outline-variant bg-surface-container-lowest rounded-xl border px-3 py-2">
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">
            {copy.startDateLabel}
          </label>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none"
          />
        </div>
        {/* End date (optional) */}
        <div className="border-outline-variant bg-surface-container-lowest rounded-xl border px-3 py-2">
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1">
            {copy.endDateLabel}
          </label>
          <input
            type="date"
            name="endDate"
            className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none"
          />
        </div>
      </div>

      {state && !state.ok && (
        <p className="text-xs font-semibold text-error">{copy.errorLabel}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-bold text-on-secondary transition hover:bg-secondary/80 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
        {copy.saveLabel}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AssignedEmployeesList — with end assignment action
   ───────────────────────────────────────────────────────────────────────── */
function AssignedEmployeesList({
  items,
  clientId,
  locale,
  copy,
}: Readonly<{
  items: readonly ClientAssignedEmployee[];
  clientId: string;
  locale: Locale;
  copy: ClientDetailCopy;
}>) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEnd = useCallback(
    (assignmentId: string) => {
      startTransition(async () => {
        const fd = makeFormData({ assignmentId, clientId, locale });
        const result = await endClientAssignmentAction(fd);
        if (result.ok) {
          toast(copy.savedLabel, "success");
        } else {
          toast(copy.errorLabel, "error");
        }
        setEndingId(null);
      });
    },
    [clientId, locale, copy.savedLabel, copy.errorLabel, toast],
  );

  return (
    <div className="grid gap-3">
      {items.length === 0 && !showAddForm && (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-6 text-sm">
          {copy.emptyAssignedEmployees}
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <UserCheck className="text-on-surface-variant size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <EntityLink
              id={item.employeeId}
              name={item.employeeName}
              type="employee"
              locale={locale}
              showInitials
              className="text-sm font-semibold"
            />
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
          {item.isActive && (
            <button
              type="button"
              onClick={() => setEndingId(item.id)}
              disabled={isPending}
              className="shrink-0 rounded-lg border border-outline-variant px-2 py-1 text-xs font-bold text-on-surface-variant transition hover:border-error hover:bg-error/10 hover:text-error disabled:opacity-50"
            >
              {copy.endAssignmentLabel}
            </button>
          )}
        </div>
      ))}

      {showAddForm ? (
        <AddAssignmentForm
          clientId={clientId}
          locale={locale}
          copy={copy}
          onClose={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
        >
          <Plus className="size-4" />
          {copy.addAssignmentLabel}
        </button>
      )}

      {/* Confirm end assignment */}
      <ConfirmDeleteModal
        open={endingId !== null}
        entityName={
          items.find((i) => i.id === endingId)?.employeeName ?? ""
        }
        onConfirm={async () => {
          if (endingId) handleEnd(endingId);
        }}
        onCancel={() => setEndingId(null)}
        title={copy.endAssignmentConfirmTitle}
        body={copy.endAssignmentConfirmBody}
        confirmLabel={copy.endAssignmentLabel}
        cancelLabel={copy.cancelLabel}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RecentPlansList — read-only
   ───────────────────────────────────────────────────────────────────────── */
function RecentPlansList({
  items,
  copy,
  locale,
}: Readonly<{
  items: readonly ClientRecentPlan[];
  copy: ClientDetailCopy;
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
            <EntityLink
              id={item.employeeId}
              name={item.employeeName}
              type="employee"
              locale={locale}
              showInitials
              className="text-sm font-semibold"
            />
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

/* ─────────────────────────────────────────────────────────────────────────
   SectionsTree — read-only display
   ───────────────────────────────────────────────────────────────────────── */
function SectionsTree({
  sections,
  copy,
}: Readonly<{
  sections: readonly ClientSectionSummary[];
  copy: ClientDetailCopy;
}>) {
  if (sections.length === 0) {
    return (
      <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
        {copy.emptySections}
      </p>
    );
  }

  const rootSections = sections.filter((s) => !s.parentSectionId);
  const childrenMap = new Map<string, ClientSectionSummary[]>();
  sections.forEach((s) => {
    if (s.parentSectionId) {
      const existing = childrenMap.get(s.parentSectionId) ?? [];
      existing.push(s);
      childrenMap.set(s.parentSectionId, existing);
    }
  });

  function renderSection(
    section: ClientSectionSummary,
    depth: number,
  ): React.ReactNode {
    const children = childrenMap.get(section.id) ?? [];
    return (
      <div key={section.id}>
        <div
          className="border-outline-variant bg-surface-container-lowest flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ marginLeft: depth > 0 ? `${depth * 20}px` : undefined }}
        >
          <Layers className="text-on-surface-variant size-4 shrink-0" />
          <p className="text-on-surface min-w-0 flex-1 truncate text-sm font-semibold">
            {section.name}
          </p>
          {children.length > 0 && (
            <span className="bg-surface-container text-on-surface-variant shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
              {children.length}
            </span>
          )}
        </div>
        {children.map((child) => renderSection(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {rootSections.map((section) => renderSection(section, 0))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────── */
export function ClientDetailInteractive({
  data,
  locale,
  copy,
}: ClientDetailInteractiveProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(data.client?.isActive ?? true);

  if (!data.client) return null;
  const { client } = data;

  async function handleToggleStatus() {
    const nextIsActive = !isActive;
    const fd = makeFormData({
      clientId: client.id,
      locale,
      nextIsActive: String(nextIsActive),
    });
    const result = await toggleClientStatusAction(fd);
    if (result.ok) {
      setIsActive(nextIsActive);
      toast(copy.savedLabel, "success");
    } else {
      toast(copy.errorLabel, "error");
    }
  }

  return (
    <div className="grid gap-6">
      {/* Back link */}
      <div>
        <Link
          className="text-on-surface-variant hover:text-secondary inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          href={`/${locale}/admin?tab=clients`}
          prefetch={false}
        >
          <ArrowLeft className="size-4" />
          {copy.backToClients}
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <AvatarUpload
          currentAvatarPath={client.avatarPath}
          entityId={client.id}
          entityName={client.name}
          locale={locale}
          variant="client"
          copy={{
            changeLabel: copy.avatarChangeLabel,
            uploadLabel: copy.avatarUploadLabel,
            savedLabel: copy.avatarSavedLabel,
            errorLabel: copy.avatarErrorLabel,
          }}
        />
        <div className="min-w-0 flex-1">
          {/* Editable name */}
          <InlineEditField
            value={client.name}
            displayClassName="font-heading text-primary-container text-2xl font-bold"
            onSave={async (val) => {
              const fd = makeFormData({
                clientId: client.id,
                locale,
                name: val,
              });
              const result = await updateClientNameAction(fd);
              if (result.ok) {
                toast(copy.savedLabel, "success");
                return null;
              }
              toast(copy.errorLabel, "error");
              return copy.errorLabel;
            }}
          />
          <p className="text-on-surface-variant text-sm mt-0.5">
            {client.address || "—"}
          </p>
        </div>
        {/* Editable status toggle */}
        <InlineStatusToggle
          isActive={isActive}
          activeLabel={copy.statusActive}
          inactiveLabel={copy.statusInactive}
          onToggle={handleToggleStatus}
          className="ml-auto"
        />
      </div>

      {/* ── Profile (all fields inline-editable) ── */}
      <ProfileSection client={client} locale={locale} copy={copy} />

      {/* ── Sections (read-only summary, manage in Sections tab) ── */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <Layers className="size-5" />
          {copy.sectionsTitle}
        </h2>
        <SectionsTree copy={copy} sections={data.sections} />
      </section>

      {/* ── Assigned Employees (editable) ── */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <CalendarCheck className="size-5" />
          {copy.assignedEmployeesTitle}
        </h2>
        <AssignedEmployeesList
          items={data.assignedEmployees}
          clientId={client.id}
          locale={locale}
          copy={copy}
        />
      </section>

      {/* ── Recent Plans (read-only) ── */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container flex items-center gap-2 text-lg font-bold">
          <ClipboardList className="size-5" />
          {copy.recentPlansTitle}
        </h2>
        <RecentPlansList copy={copy} items={data.recentPlans} locale={locale} />
      </section>
    </div>
  );
}
