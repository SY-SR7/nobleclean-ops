import { Suspense } from "react";
import { Image as ImageIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Button,
  MetricCard,
  PriorityStatusBadge,
  TaskItemCard,
  ToolStepCard,
} from "@/components/ui";
import { ClientsInteractive } from "@/features/admin/clients/ClientsInteractive";
import { listAdminClients } from "@/features/admin/clients/queries";
import {
  ClientForm,
  ClientStatusForm,
} from "@/features/admin/clients/ClientForm";
import {
  getAdminHomeData,
  type RecentAdminPlan,
} from "@/features/admin/home/queries";
import {
  EscalationInteractiveCard,
  LastCleanedInteractiveCard,
  PlanInteractiveCard,
} from "@/features/admin/reports/ReportsInteractive";
import { getReportsData } from "@/features/admin/reports/queries";
import { ScheduleInteractive } from "@/features/admin/schedule/ScheduleInteractive";
import {
  DeleteScheduleForm,
  ScheduleForm,
} from "@/features/admin/schedule/ScheduleForms";
import { getScheduleData } from "@/features/admin/schedule/queries";
import {
  DeleteToolStepForm,
  DeleteEntityForm,
  LeafItemForm,
  ReferenceImageForm,
  SectionForm,
  ToolStepForm,
} from "@/features/admin/sections-items/SectionsItemsForms";
import { SectionsInteractive } from "@/features/admin/sections-items/SectionsInteractive";
import { getSectionsItemsData } from "@/features/admin/sections-items/queries";
import { StaffInteractive } from "@/features/admin/staff/StaffInteractive";
import {
  EndAssignmentForm,
  StaffAssignmentForm,
} from "@/features/admin/staff/StaffAssignmentForms";
import { getStaffAssignmentsData } from "@/features/admin/staff/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";
import { requireRole } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: string;
    clientId?: string;
    sectionId?: string;
    q?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
}>;

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultDateFrom() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 14);
  return isoDate(d);
}

function isIsoDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && isoDate(d) === v;
}

function safeDate(v: string, fallback: string) {
  return isIsoDate(v) ? v : fallback;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function safeMonth(v: string) {
  return /^\d{4}-\d{2}$/.test(v) ? v : currentMonth();
}

function monthBounds(month: string) {
  const [year, mn] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mn - 1, 1));
  const end = new Date(Date.UTC(year, mn, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function formatHours(hours: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    maximumFractionDigits: 1,
  }).format(hours);
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function TabSkeleton() {
  return (
    <div className="grid gap-4 animate-pulse">
      <div className="bg-surface-container h-8 w-48 rounded" />
      <div className="bg-surface-container h-24 rounded" />
      <div className="bg-surface-container h-24 rounded" />
      <div className="bg-surface-container h-24 rounded" />
    </div>
  );
}

/* ─── Tab Bar ────────────────────────────────────────────────────────────── */
function TabBar({
  locale,
  activeTab,
  labels,
}: {
  locale: Locale;
  activeTab: string;
  labels: Record<string, string>;
}) {
  const tabs = [
    { id: "home", href: `/${locale}/admin`, label: labels.home },
    { id: "clients", href: `/${locale}/admin?tab=clients`, label: labels.clients },
    { id: "staff", href: `/${locale}/admin?tab=staff`, label: labels.staff },
    { id: "sections", href: `/${locale}/admin?tab=sections`, label: labels.sections },
    { id: "schedule", href: `/${locale}/admin?tab=schedule`, label: labels.schedule },
    { id: "reports", href: `/${locale}/admin?tab=reports`, label: labels.reports },
  ];

  return (
    <div className="border-outline-variant -mx-mobile-margin lg:-mx-desktop-margin -mt-6 lg:-mt-8 mb-6 overflow-x-auto border-b lg:mb-8">
      <div className="px-mobile-margin lg:px-desktop-margin flex min-w-max gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={[
              "inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
              activeTab === tab.id
                ? "border-secondary text-secondary"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

import { HomeInteractive } from "@/features/admin/home/HomeInteractive";
import { AdminSpaContainer } from "@/features/admin/AdminSpaContainer";

/* ═══════════════════════════════════════════════════════════════════════════
   HOME TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function HomeTab({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const data = await getAdminHomeData(locale);

  const copy = {
    activeAssignments: t(messages, "adminHome.metrics.activeAssignments"),
    activeClients: t(messages, "adminHome.metrics.activeClients"),
    attentionItems: t(messages, "adminHome.metrics.attentionItems"),
    client: t(messages, "adminHome.recent.client"),
    complaint: t(messages, "adminHome.metadata.complaint"),
    dueItems: t(messages, "adminHome.metrics.dueItems"),
    employee: t(messages, "adminHome.recent.employee"),
    employees: t(messages, "adminHome.metadata.employees"),
    emptyRecent: t(messages, "adminHome.emptyRecent"),
    highPriority: t(messages, "adminHome.metadata.highPriority"),
    hours: t(messages, "adminHome.metadata.hours"),
    loadError: t(messages, "adminHome.feedback.loadError"),
    mandatoryEscalations: t(messages, "adminHome.metrics.mandatoryEscalations"),
    openPlans: t(messages, "adminHome.attention.openPlans"),
    recentWork: t(messages, "adminHome.recentWork"),
    sectionAttention: t(messages, "adminHome.attention.title"),
    sectionWorkflows: t(messages, "adminHome.workflows.title"),
    subtitle: t(messages, "adminHome.subtitle"),
    title: t(messages, "adminHome.title"),
    todaySchedule: t(messages, "adminHome.metrics.todaySchedule"),
    totalItems: t(messages, "adminHome.metadata.totalItems"),
    viewClients: t(messages, "adminHome.shortcuts.viewClients"),
    viewReports: t(messages, "adminHome.shortcuts.viewReports"),
    workflowClients: t(messages, "adminHome.workflows.clients"),
    workflowReports: t(messages, "adminHome.workflows.reports"),
    workflowSchedule: t(messages, "adminHome.workflows.schedule"),
    workflowSectionsItems: t(messages, "adminHome.workflows.sectionsItems"),
    workflowStaff: t(messages, "adminHome.workflows.staff"),
  };

  if (!data.ok) {
    return (
      <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
        {copy.loadError}
      </p>
    );
  }

  return <HomeInteractive data={data} locale={locale} copy={copy} />;
}



/* ═══════════════════════════════════════════════════════════════════════════
   CLIENTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function ClientsTab({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const result = await listAdminClients(locale, "");
  const formCopy = {
    addressLabel: t(messages, "adminClients.fields.address"),
    contactEmailLabel: t(messages, "adminClients.fields.contactEmail"),
    contactNameLabel: t(messages, "adminClients.fields.contactName"),
    contactNotesLabel: t(messages, "adminClients.fields.contactNotes"),
    contactPhoneLabel: t(messages, "adminClients.fields.contactPhone"),
    createSubmit: t(messages, "adminClients.actions.create"),
    createTitle: t(messages, "adminClients.createTitle"),
    errorMessage: t(messages, "adminClients.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    nameLabel: t(messages, "adminClients.fields.name"),
    successCreated: t(messages, "adminClients.feedback.created"),
    successUpdated: t(messages, "adminClients.feedback.updated"),
    updateSubmit: t(messages, "actions.save"),
    updateTitle: t(messages, "adminClients.editTitle"),
  };
  const statusCopy = {
    deactivate: t(messages, "actions.deactivate"),
    errorMessage: t(messages, "adminClients.feedback.error"),
    reactivate: t(messages, "adminClients.actions.reactivate"),
    success: t(messages, "adminClients.feedback.statusUpdated"),
  };
  const interactiveCopy = {
    active: t(messages, "adminClients.status.active"),
    inactive: t(messages, "adminClients.status.inactive"),
    address: t(messages, "adminClients.fields.address"),
    contactName: t(messages, "adminClients.fields.contactName"),
    contactEmail: t(messages, "adminClients.fields.contactEmail"),
    contactPhone: t(messages, "adminClients.fields.contactPhone"),
    contactNotes: t(messages, "adminClients.fields.contactNotes"),
    updatedAt: t(messages, "adminClients.fields.updatedAt"),
    notAvailable: t(messages, "adminClients.notAvailable"),
    viewSections: t(messages, "navigation.admin.sectionsItems"),
    viewSchedule: t(messages, "navigation.admin.schedule"),
  };

  const activeCount = result.clients.filter((c) => c.isActive).length;
  const inactiveCount = result.clients.length - activeCount;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {t(messages, "navigation.admin.clients")}
        </h1>
        <dl className="grid grid-cols-2 gap-3 sm:w-fit">
          <div className="bg-surface-container-low rounded p-3">
            <dt className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "adminClients.summary.active")}</dt>
            <dd className="font-heading text-primary-container text-2xl font-bold">{activeCount}</dd>
          </div>
          <div className="bg-surface-container-low rounded p-3">
            <dt className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "adminClients.summary.inactive")}</dt>
            <dd className="font-heading text-primary-container text-2xl font-bold">{inactiveCount}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <ClientForm copy={formCopy} formIdPrefix="new-client" locale={locale} mode="create" />
        </aside>
        <div className="grid min-w-0 gap-4">
          {!result.ok && (
            <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
              {t(messages, "adminClients.feedback.loadError")}
            </p>
          )}
          {result.ok && result.clients.length === 0 && (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
              {t(messages, "adminClients.empty")}
            </p>
          )}
          <ClientsInteractive clients={result.clients} locale={locale} copy={interactiveCopy} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAFF TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function StaffTab({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const data = await getStaffAssignmentsData(locale);
  const assignCopy = {
    activeEnded: t(messages, "staff.feedback.ended"),
    assignTitle: t(messages, "staff.assignTitle"),
    clientLabel: t(messages, "staff.fields.client"),
    employeeLabel: t(messages, "staff.fields.employee"),
    endAction: t(messages, "staff.actions.endAssignment"),
    endDateLabel: t(messages, "staff.fields.endDate"),
    error: t(messages, "staff.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    inactiveClient: t(messages, "adminClients.status.inactive"),
    save: t(messages, "actions.save"),
    saved: t(messages, "staff.feedback.saved"),
    startDateLabel: t(messages, "staff.fields.startDate"),
    updateTitle: t(messages, "staff.updateTitle"),
  };
  const interactiveCopy = {
    active: t(messages, "adminClients.status.active"),
    inactive: t(messages, "adminClients.status.inactive"),
    statusActive: t(messages, "staff.status.active"),
    statusInactive: t(messages, "staff.status.inactive"),
    clients: t(messages, "navigation.admin.clients"),
    employees: t(messages, "staff.employees"),
  };
  const activeCount = data.assignments.filter((a) => a.isActive).length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {t(messages, "navigation.admin.staff")}
        </h1>
        <div className="grid grid-cols-2 gap-3 sm:w-fit">
          <div className="bg-surface-container-low rounded p-3">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "staff.activeAssignments")}</p>
            <p className="font-heading text-primary-container text-2xl font-bold">{activeCount}</p>
          </div>
          <div className="bg-surface-container-low rounded p-3">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "staff.employees")}</p>
            <p className="font-heading text-primary-container text-2xl font-bold">{data.employees.length}</p>
          </div>
        </div>
      </div>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {t(messages, "staff.feedback.loadError")}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <StaffAssignmentForm
            clients={data.clients}
            copy={assignCopy}
            employees={data.employees}
            locale={locale}
            mode="create"
          />
        </aside>
        <div className="grid min-w-0 gap-4">
          {data.assignments.length === 0 ? (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
              {t(messages, "staff.emptyAssignments")}
            </p>
          ) : (
            <StaffInteractive
              assignments={data.assignments}
              clients={data.clients}
              employees={data.employees}
              locale={locale}
              copy={interactiveCopy}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTIONS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function SectionsTab({
  locale,
  clientId,
  sectionId,
}: {
  locale: Locale;
  clientId: string;
  sectionId: string;
}) {
  const messages = getMessages(locale);
  const data = await getSectionsItemsData(locale, clientId, sectionId);
  const selectedSection = data.sections.find((s) => s.id === data.selectedSectionId);
  const selectedClientId = data.selectedClientId;

  function descendantIds(sectionId: string) {
    const byParent = new Map<string, typeof data.sections[0][]>();
    data.sections.forEach((s) => {
      if (!s.parentSectionId) return;
      byParent.set(s.parentSectionId, [...(byParent.get(s.parentSectionId) ?? []), s]);
    });
    const ids = new Set<string>();
    function walk(pid: string) {
      (byParent.get(pid) ?? []).forEach((child) => { ids.add(child.id); walk(child.id); });
    }
    walk(sectionId);
    return ids;
  }

  const blockedParentIds = selectedSection ? descendantIds(selectedSection.id) : new Set<string>();
  const editSectionOptions = selectedSection
    ? data.sectionOptions.filter((o) => !blockedParentIds.has(o.id))
    : data.sectionOptions;

  const forms = {
    attachImage: t(messages, "sectionsItems.actions.attachImage"),
    createLeafTitle: t(messages, "sectionsItems.createLeafTitle"),
    createSectionTitle: t(messages, "sectionsItems.createSectionTitle"),
    deleteLeaf: t(messages, "sectionsItems.actions.deleteLeaf"),
    deleteSection: t(messages, "sectionsItems.actions.deleteSection"),
    deleteToolStep: t(messages, "sectionsItems.actions.deleteToolStep"),
    editLeafTitle: t(messages, "sectionsItems.editLeafTitle"),
    editSectionTitle: t(messages, "sectionsItems.editSectionTitle"),
    editToolStepTitle: t(messages, "sectionsItems.editToolStepTitle"),
    estimatedMinutesLabel: t(messages, "sectionsItems.fields.estimatedMinutes"),
    fieldError: t(messages, "validation.generic"),
    imageAttached: t(messages, "sectionsItems.feedback.imageAttached"),
    imageLabel: t(messages, "sectionsItems.fields.referenceImage"),
    leafNameLabel: t(messages, "sectionsItems.fields.leafName"),
    mandatoryLabel: t(messages, "sectionsItems.mandatory"),
    notesLabel: t(messages, "sectionsItems.fields.notes"),
    optionalLabel: t(messages, "sectionsItems.optional"),
    parentSectionLabel: t(messages, "sectionsItems.fields.parentSection"),
    quantityLabel: t(messages, "sectionsItems.fields.quantity"),
    recurrenceDaysLabel: t(messages, "sectionsItems.fields.recurrenceDays"),
    rootParent: t(messages, "sectionsItems.rootParent"),
    save: t(messages, "actions.save"),
    saved: t(messages, "sectionsItems.feedback.saved"),
    saveError: t(messages, "sectionsItems.feedback.error"),
    sectionLabel: t(messages, "sectionsItems.fields.section"),
    sectionNameLabel: t(messages, "sectionsItems.fields.sectionName"),
    stepEstimatedMinutesLabel: t(messages, "sectionsItems.fields.stepEstimatedMinutes"),
    stepNotesLabel: t(messages, "sectionsItems.fields.stepNotes"),
    stepRecurrenceDaysLabel: t(messages, "sectionsItems.fields.stepRecurrenceDays"),
    stepSequenceLabel: t(messages, "sectionsItems.fields.sequenceOrder"),
    sortOrderLabel: t(messages, "sectionsItems.fields.sortOrder"),
    tagComplaint: t(messages, "sectionsItems.tags.complaint"),
    tagHighPriority: t(messages, "sectionsItems.tags.highPriority"),
    tagLabel: t(messages, "sectionsItems.fields.tag"),
    tagNormal: t(messages, "sectionsItems.tags.normal"),
    toolNameLabel: t(messages, "sectionsItems.fields.toolName"),
    toolStepCreateTitle: t(messages, "sectionsItems.toolStepCreateTitle"),
  };

  const copy = {
    clientLabel: t(messages, "sectionsItems.clientLabel"),
    edit: t(messages, "actions.edit"),
    emptyClients: t(messages, "sectionsItems.emptyClients"),
    emptyLeafItems: t(messages, "sectionsItems.emptyLeafItems"),
    emptySections: t(messages, "sectionsItems.emptySections"),
    hasImage: t(messages, "sectionsItems.hasImage"),
    inactive: t(messages, "adminClients.status.inactive"),
    leafCount: t(messages, "sectionsItems.leafCount"),
    leafItemsTitle: t(messages, "sectionsItems.leafItemsTitle"),
    lastPerformed: t(messages, "sectionsItems.lastPerformed"),
    loadError: t(messages, "sectionsItems.feedback.loadError"),
    minutes: t(messages, "sectionsItems.minutes"),
    neverPerformed: t(messages, "sectionsItems.neverPerformed"),
    noToolSteps: t(messages, "sectionsItems.noToolSteps"),
    optional: t(messages, "sectionsItems.optional"),
    quantity: t(messages, "sectionsItems.quantity"),
    recurrenceDays: t(messages, "sectionsItems.recurrenceDays"),
    selectClient: t(messages, "sectionsItems.actions.selectClient"),
    selectedSectionTitle: t(messages, "sectionsItems.selectedSectionTitle"),
    stepEstimateTotal: t(messages, "sectionsItems.stepEstimateTotal"),
    toolStepsTitle: t(messages, "sectionsItems.toolStepsTitle"),
    title: t(messages, "navigation.admin.sectionsItems"),
    treeTitle: t(messages, "sectionsItems.treeTitle"),
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">{copy.title}</h1>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">{copy.loadError}</p>
      )}
      {data.clients.length === 0 && (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyClients}</p>
      )}

      {selectedClientId ? (
        <>
          {/* Client selector */}
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" action={`/${locale}/admin`}>
            <input type="hidden" name="tab" value="sections" />
            <div className="grid gap-2 sm:min-w-80">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="sections-client">
                {copy.clientLabel}
              </label>
              <select className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none" defaultValue={selectedClientId} id="sections-client" name="clientId">
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.isActive ? client.name : `${client.name} (${copy.inactive})`}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">{copy.selectClient}</Button>
          </form>

          <div className="grid gap-6 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
            {/* Left: create form + section tree (with clickable SectionsInteractive) */}
            <div className="grid h-fit gap-6">
              <aside className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                <SectionForm clientId={selectedClientId} copy={forms} locale={locale} mode="create" sectionOptions={data.sectionOptions} />
              </aside>
              <section className="grid gap-3">
                <h2 className="font-heading text-primary-container text-xl font-bold">{copy.treeTitle}</h2>
                {data.sections.length > 0 ? (
                  <SectionsInteractive
                    sections={data.sections}
                    leafItems={data.leafItems}
                    locale={locale}
                    selectedSectionId={data.selectedSectionId}
                    copy={{
                      minutes: copy.minutes,
                      leafCount: copy.leafCount,
                      lastPerformed: copy.lastPerformed,
                      neverPerformed: copy.neverPerformed,
                      recurrenceDays: copy.recurrenceDays,
                      optional: copy.optional,
                      quantity: copy.quantity,
                      toolStepsTitle: copy.toolStepsTitle,
                      stepEstimateTotal: copy.stepEstimateTotal,
                      hasImage: copy.hasImage,
                      noToolSteps: copy.noToolSteps,
                    }}
                    tagLabels={{
                      normal: forms.tagNormal,
                      complaint: forms.tagComplaint,
                      high_priority: forms.tagHighPriority,
                    }}
                  />
                ) : (
                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptySections}</p>
                )}
              </section>
            </div>

            {/* Right: selected section details + leaf items */}
            <div className="grid min-w-0 gap-6">
              {selectedSection && (
                <>
                  <section className="border-outline-variant bg-surface-container-lowest grid gap-5 rounded border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{copy.selectedSectionTitle}</p>
                        <h2 className="font-heading text-primary-container mt-1 text-xl font-bold">{selectedSection.name}</h2>
                      </div>
                      <DeleteEntityForm clientId={selectedClientId} copy={forms} entityId={selectedSection.id} kind="section" locale={locale} />
                    </div>
                    <div className="grid gap-5 2xl:grid-cols-2">
                      <SectionForm clientId={selectedClientId} copy={forms} locale={locale} mode="update" section={selectedSection} sectionOptions={editSectionOptions} />
                      <ReferenceImageForm clientId={selectedClientId} copy={forms} entityId={selectedSection.id} kind="section" locale={locale} />
                    </div>
                  </section>

                  <aside className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                    <LeafItemForm clientId={selectedClientId} copy={forms} locale={locale} mode="create" sectionOptions={data.sectionOptions} selectedSectionId={selectedSection.id} />
                  </aside>
                </>
              )}

              <section className="grid gap-3">
                <h2 className="font-heading text-primary-container text-xl font-bold">{copy.leafItemsTitle}</h2>
                {selectedSection && data.leafItems.length > 0 ? (
                  <div className="grid gap-3">
                    {data.leafItems.map((item) => (
                      <div key={item.id} className="grid gap-2">
                        <TaskItemCard
                          badge={
                            item.tag !== "normal" ? (
                              <PriorityStatusBadge
                                label={item.tag === "complaint" ? forms.tagComplaint : forms.tagHighPriority}
                                tone={item.tag === "complaint" ? "warning" : "critical"}
                              />
                            ) : null
                          }
                          estimatedMinutes={`${item.estimatedMinutes} ${copy.minutes}`}
                          lastCleaned={item.recurrenceDays ? `${copy.recurrenceDays}: ${item.recurrenceDays}` : undefined}
                          thumbnail={
                            item.hasReferenceImage ? (
                              <span className="text-secondary flex size-full items-center justify-center">
                                <ImageIcon aria-hidden="true" className="size-5" />
                              </span>
                            ) : null
                          }
                          title={item.name}
                        />
                        <details className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                          <summary className="text-primary-container cursor-pointer text-sm font-bold uppercase tracking-wide">{copy.edit}</summary>
                          <div className="mt-4 grid gap-5">
                            <LeafItemForm clientId={selectedClientId} copy={forms} leafItem={item} locale={locale} mode="update" sectionOptions={data.sectionOptions} selectedSectionId={selectedSection.id} />
                            <ReferenceImageForm clientId={selectedClientId} copy={forms} entityId={item.id} kind="leafItem" locale={locale} />
                            {/* Tool steps */}
                            <section className="grid gap-4">
                              <div>
                                <h3 className="font-heading text-primary-container text-lg font-bold">{copy.toolStepsTitle}</h3>
                                <p className="text-on-surface-variant mt-1 text-sm">{copy.stepEstimateTotal}: {item.stepEstimateMinutes} {copy.minutes}</p>
                              </div>
                              <div className="grid gap-3">
                                {item.toolSteps.length > 0 ? item.toolSteps.map((step) => (
                                  <div key={step.id} className="grid gap-2">
                                    <ToolStepCard
                                      actions={<DeleteToolStepForm clientId={selectedClientId} copy={forms} leafItemId={item.id} locale={locale} stepId={step.id} />}
                                      duration={`${step.estimatedMinutes} ${copy.minutes}`}
                                      isMandatory={step.isMandatory}
                                      mandatoryLabel={forms.mandatoryLabel}
                                      notes={<span className="grid gap-1"><span>{copy.lastPerformed}: {step.lastPerformedAt ? new Date(step.lastPerformedAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB") : copy.neverPerformed}</span>{step.notes ? <span>{step.notes}</span> : null}</span>}
                                      optionalLabel={forms.optionalLabel}
                                      recurrence={`${copy.recurrenceDays}: ${step.recurrenceDays}`}
                                      sequenceOrder={step.sequenceOrder}
                                      title={step.toolName}
                                    />
                                    <details className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                                      <summary className="text-primary-container cursor-pointer text-sm font-bold uppercase tracking-wide">{copy.edit}</summary>
                                      <div className="mt-4">
                                        <ToolStepForm clientId={selectedClientId} copy={forms} leafItemId={item.id} locale={locale} mode="update" step={step} />
                                      </div>
                                    </details>
                                  </div>
                                )) : (
                                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-5 text-sm">{copy.noToolSteps}</p>
                                )}
                              </div>
                              <div className="border-outline-variant bg-surface-container-low rounded border p-4">
                                <ToolStepForm
                                  clientId={selectedClientId}
                                  copy={forms}
                                  leafItemId={item.id}
                                  locale={locale}
                                  mode="create"
                                  nextSequenceOrder={item.toolSteps.reduce((max, s) => Math.max(max, s.sequenceOrder), 0) + 1}
                                />
                              </div>
                            </section>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyLeafItems}</p>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCHEDULE TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function ScheduleTab({ locale, month }: { locale: Locale; month: string }) {
  const messages = getMessages(locale);
  const safeM = safeMonth(month);
  const { from, to } = monthBounds(safeM);
  const data = await getScheduleData(locale, from, to);

  const scheduleCopy = {
    allocatedHoursLabel: t(messages, "schedule.fields.allocatedHours"),
    clientLabel: t(messages, "staff.fields.client"),
    createTitle: t(messages, "schedule.createTitle"),
    deleteAction: t(messages, "schedule.actions.delete"),
    deleted: t(messages, "schedule.feedback.deleted"),
    employeeLabel: t(messages, "staff.fields.employee"),
    error: t(messages, "schedule.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    inactiveClient: t(messages, "adminClients.status.inactive"),
    save: t(messages, "actions.save"),
    saved: t(messages, "schedule.feedback.saved"),
    updateTitle: t(messages, "schedule.updateTitle"),
    workDateLabel: t(messages, "schedule.fields.workDate"),
  };

  const interactiveCopy = {
    workDate: t(messages, "schedule.fields.workDate"),
    employees: t(messages, "staff.employees"),
    clients: t(messages, "navigation.admin.clients"),
    allocatedHours: t(messages, "schedule.fields.hours"),
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-heading text-primary-container text-2xl font-bold">{t(messages, "navigation.admin.schedule")}</h1>
        <div className="grid grid-cols-2 gap-3 sm:w-fit">
          <div className="bg-surface-container-low rounded p-3">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "schedule.scheduledEmployees")}</p>
            <p className="font-heading text-primary-container text-2xl font-bold">{data.scheduledEmployeeCount}</p>
          </div>
          <div className="bg-surface-container-low rounded p-3">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{t(messages, "schedule.allocatedHours")}</p>
            <p className="font-heading text-primary-container text-2xl font-bold">{data.totalAllocatedHours}h</p>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <form className="flex items-end gap-3" action={`/${locale}/admin`}>
        <input type="hidden" name="tab" value="schedule" />
        <div className="grid gap-2">
          <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="schedule-month">{t(messages, "schedule.month")}</label>
          <input className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm outline-none transition" defaultValue={safeM} id="schedule-month" name="month" type="month" />
        </div>
        <Button type="submit">{t(messages, "schedule.selectMonth")}</Button>
      </form>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">{t(messages, "schedule.feedback.loadError")}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <ScheduleForm clients={data.clients} copy={scheduleCopy} employees={data.employees} locale={locale} mode="create" />
        </aside>
        <div className="grid min-w-0 gap-4">
          {data.schedules.length === 0 ? (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{t(messages, "schedule.emptySchedules")}</p>
          ) : (
            <ScheduleInteractive schedules={data.schedules} locale={locale} copy={interactiveCopy} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPORTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
async function ReportsTab({
  locale,
  clientId,
  from: fromProp,
  to: toProp,
}: {
  locale: Locale;
  clientId: string;
  from: string;
  to: string;
}) {
  const messages = getMessages(locale);
  const today = isoDate(new Date());
  const from = safeDate(fromProp, defaultDateFrom());
  const to = safeDate(toProp, today);
  const data = await getReportsData(locale, clientId, from <= to ? from : to, from <= to ? to : from);
  const copy = {
    clientLabel: t(messages, "reports.clientLabel"),
    completePlans: t(messages, "reports.completePlans"),
    completionRate: t(messages, "reports.completionRate"),
    dateFrom: t(messages, "reports.dateFrom"),
    dateTo: t(messages, "reports.dateTo"),
    emptyClients: t(messages, "reports.emptyClients"),
    emptyIncomplete: t(messages, "reports.emptyIncomplete"),
    emptyLastCleaned: t(messages, "reports.emptyLastCleaned"),
    emptyMandatoryStepEscalations: t(messages, "reports.emptyMandatoryStepEscalations"),
    employee: t(messages, "reports.employee"),
    filter: t(messages, "reports.actions.filter"),
    incompletePlans: t(messages, "reports.incompletePlans"),
    inactive: t(messages, "adminClients.status.inactive"),
    items: t(messages, "reports.items"),
    lastCleaned: t(messages, "reports.lastCleaned"),
    lastPerformed: t(messages, "reports.lastPerformed"),
    loadError: t(messages, "reports.feedback.loadError"),
    mandatory: t(messages, "reports.mandatory"),
    mandatoryStepEscalations: t(messages, "reports.mandatoryStepEscalations"),
    minutes: t(messages, "sectionsItems.minutes"),
    neverCleaned: t(messages, "reports.neverCleaned"),
    neverPerformed: t(messages, "reports.neverPerformed"),
    recurrenceDays: t(messages, "sectionsItems.recurrenceDays"),
    section: t(messages, "navigation.admin.sectionsItems"),
    statusInProgress: t(messages, "status.inProgress"),
    statusSubmitted: t(messages, "status.submitted"),
    title: t(messages, "navigation.admin.reports"),
    totalPlans: t(messages, "reports.totalPlans"),
    workDate: t(messages, "schedule.fields.workDate"),
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">{copy.title}</h1>
      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">{copy.loadError}</p>
      )}
      {data.clients.length === 0 && (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyClients}</p>
      )}
      {data.selectedClientId ? (
        <>
          {/* Filters */}
          <form className="grid gap-3 rounded sm:grid-cols-[minmax(14rem,20rem)_repeat(2,12rem)_auto] sm:items-end" action={`/${locale}/admin`}>
            <input type="hidden" name="tab" value="reports" />
            <div className="grid gap-2">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="reports-client">{copy.clientLabel}</label>
              <select className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm outline-none transition" defaultValue={data.selectedClientId} id="reports-client" name="clientId">
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.isActive ? c.name : `${c.name} (${copy.inactive})`}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="reports-from">{copy.dateFrom}</label>
              <input className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm outline-none transition" defaultValue={from} id="reports-from" name="from" type="date" />
            </div>
            <div className="grid gap-2">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="reports-to">{copy.dateTo}</label>
              <input className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm outline-none transition" defaultValue={to} id="reports-to" name="to" type="date" />
            </div>
            <Button type="submit">{copy.filter}</Button>
          </form>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={copy.totalPlans} value={data.totalPlans} />
            <MetricCard label={copy.completePlans} statusTone="success" value={data.totalCompletePlans} />
            <MetricCard label={copy.incompletePlans} statusTone={data.totalIncompletePlans > 0 ? "warning" : "recent"} value={data.totalIncompletePlans} />
            <MetricCard label={copy.mandatoryStepEscalations} statusTone={data.mandatoryStepEscalations.length > 0 ? "critical" : "recent"} value={data.mandatoryStepEscalations.length} />
            <MetricCard label={copy.completionRate} metadata="%" statusTone={data.completionRate === 100 ? "success" : "warning"} value={data.completionRate} />
          </div>

          {/* Three columns of interactive cards */}
          <div className="grid gap-6 xl:grid-cols-3">
            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">{copy.mandatoryStepEscalations}</h2>
              {data.mandatoryStepEscalations.length > 0 ? (
                <div className="grid gap-2">
                  {data.mandatoryStepEscalations.map((e) => (
                    <EscalationInteractiveCard key={e.id} item={e} locale={locale} copy={{ lastPerformed: copy.lastPerformed, neverPerformed: copy.neverPerformed, minutes: copy.minutes, recurrenceDays: copy.recurrenceDays, mandatory: copy.mandatory }} />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyMandatoryStepEscalations}</p>
              )}
            </section>

            <section className="grid h-fit gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">{copy.incompletePlans}</h2>
              {data.incompletePlans.length > 0 ? (
                <div className="grid gap-2">
                  {data.incompletePlans.map((plan) => (
                    <PlanInteractiveCard key={plan.id} plan={plan} locale={locale} copy={{ employee: copy.employee, workDate: copy.workDate, statusInProgress: copy.statusInProgress, statusSubmitted: copy.statusSubmitted, items: copy.items }} />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyIncomplete}</p>
              )}
            </section>

            <section className="grid gap-3">
              <h2 className="font-heading text-primary-container text-xl font-bold">{copy.lastCleaned}</h2>
              {data.lastCleanedItems.length > 0 ? (
                <div className="grid gap-2">
                  {data.lastCleanedItems.map((item) => (
                    <LastCleanedInteractiveCard key={item.id} item={item} locale={locale} copy={{ lastCleaned: copy.lastCleaned, neverCleaned: copy.neverCleaned, minutes: copy.minutes, recurrenceDays: copy.recurrenceDays, section: copy.section }} />
                  ))}
                </div>
              ) : (
                <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">{copy.emptyLastCleaned}</p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE ENTRY
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;

  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  await requireRole(locale, "admin");

  const messages = getMessages(locale);
  const tab = firstValue(sp.tab) || "home";

  const tabLabels = {
    home: t(messages, "navigation.admin.home"),
    clients: t(messages, "navigation.admin.clients"),
    staff: t(messages, "navigation.admin.staff"),
    sections: t(messages, "navigation.admin.sectionsItems"),
    schedule: t(messages, "navigation.admin.schedule"),
    reports: t(messages, "navigation.admin.reports"),
  };

  return (
    <AdminSpaContainer labels={tabLabels}>
      {(activeTab) => (
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === "home" && <HomeTab locale={locale} />}
          {activeTab === "clients" && <ClientsTab locale={locale} />}
          {activeTab === "staff" && <StaffTab locale={locale} />}
          {activeTab === "sections" && (
            <SectionsTab
              locale={locale}
              clientId={firstValue(sp.clientId)}
              sectionId={firstValue(sp.sectionId)}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab locale={locale} month={firstValue(sp.month)} />
          )}
          {activeTab === "reports" && (
            <ReportsTab
              locale={locale}
              clientId={firstValue(sp.clientId)}
              from={firstValue(sp.from)}
              to={firstValue(sp.to)}
            />
          )}
        </Suspense>
      )}
    </AdminSpaContainer>
  );
}
