import { Suspense } from "react";
import { Image as ImageIcon, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Button,
  MetricCard,
  PriorityStatusBadge,
  TaskItemCard,
  ToolStepCard,
} from "@/components/ui";
import { FormModalTrigger } from "@/components/ui/form-modal-trigger";
import { ClientsInteractive } from "@/features/admin/clients/ClientsInteractive";
import { listAdminClients } from "@/features/admin/clients/queries";
import { purgeSportCityClientAction } from "@/features/admin/clients/actions";
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
  PlansGridContainer,
  LastCleanedGridContainer,
  EscalationsGridContainer,
  ReportsInteractiveMain,
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
    openPlans: t(messages, "adminHome.metrics.openPlans"),
    recentWork: t(messages, "adminHome.sections.recentWork"),
    sectionAttention: t(messages, "adminHome.sections.attention"),
    sectionWorkflows: t(messages, "adminHome.sections.workflows"),
    subtitle: t(messages, "adminHome.subtitle"),
    title: t(messages, "adminHome.title"),
    todaySchedule: t(messages, "adminHome.metrics.todaySchedule"),
    totalItems: t(messages, "adminHome.metadata.totalItems"),
    viewClients: t(messages, "adminHome.actions.viewClients"),
    viewReports: t(messages, "adminHome.actions.viewReports"),
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
  await purgeSportCityClientAction(locale);
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
    viewDetails: t(messages, "adminClients.viewDetails"),
    deleteLabel: "Löschen",
    deleteConfirmTitle: "Kunde löschen?",
    deleteConfirmBody: "Der Kunde wird unwiderruflich gelöscht. Nur möglich, wenn keine Abschnitte vorhanden sind.",
    deleteConfirmLabel: "Löschen",
    cancelLabel: "Abbrechen",
    savedLabel: "Gespeichert",
    errorLabel: "Fehler beim Speichern",
    deleteBlockedLabel: "Kunde hat noch Abschnitte – zuerst löschen",
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

      <FormModalTrigger buttonLabel={formCopy.createTitle} modalTitle={formCopy.createTitle}>
        <ClientForm copy={formCopy} formIdPrefix="new-client" locale={locale} mode="create" />
      </FormModalTrigger>

      <div className="w-full">
        {!result.ok && (
          <p className="border-error bg-error-container text-on-error-container rounded-xl border px-4 py-3 text-sm">
            {t(messages, "adminClients.feedback.loadError")}
          </p>
        )}
        {result.ok && result.clients.length === 0 && (
          <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
            {t(messages, "adminClients.empty")}
          </p>
        )}
        <ClientsInteractive clients={result.clients} locale={locale} copy={interactiveCopy} />
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
    viewDetails: t(messages, "staff.viewDetails"),
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

      <FormModalTrigger buttonLabel={assignCopy.assignTitle} modalTitle={assignCopy.assignTitle}>
        <StaffAssignmentForm
          clients={data.clients}
          copy={assignCopy}
          employees={data.employees}
          locale={locale}
          mode="create"
        />
      </FormModalTrigger>

      <div className="w-full">
        {data.assignments.length === 0 ? (
          <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
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
  );
}

import { SectionsTabClient } from "@/features/admin/sections-items/SectionsTabClient";

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

  return <SectionsTabClient data={data} forms={forms} copy={copy} locale={locale} />;
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
    allocatedHours: t(messages, "schedule.fields.allocatedHours"),
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
        <Button type="submit">{t(messages, "schedule.actions.selectMonth")}</Button>
      </form>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">{t(messages, "schedule.feedback.loadError")}</p>
      )}

      <FormModalTrigger buttonLabel={scheduleCopy.createTitle} modalTitle={scheduleCopy.createTitle}>
        <ScheduleForm clients={data.clients} copy={scheduleCopy} employees={data.employees} locale={locale} mode="create" />
      </FormModalTrigger>

      <div className="w-full">
        {data.schedules.length === 0 ? (
          <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">{t(messages, "schedule.emptySchedules")}</p>
        ) : (
          <ScheduleInteractive schedules={data.schedules} locale={locale} copy={interactiveCopy} />
        )}
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
  // Always fetch all historical data — the client-side period picker filters independently
  const allTimeFrom = `${new Date().getFullYear() - 5}-01-01`;
  const data = await getReportsData(locale, clientId, allTimeFrom, today);

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
    <ReportsInteractiveMain
      plans={data.allPlans}
      lastCleanedItems={data.lastCleanedItems}
      escalations={data.mandatoryStepEscalations}
      locale={locale}
      clients={data.clients}
      selectedClientId={data.selectedClientId}
      copy={{
        employee: copy.employee,
        workDate: copy.workDate,
        statusInProgress: copy.statusInProgress,
        statusSubmitted: copy.statusSubmitted,
        items: copy.items,
        lastCleaned: copy.lastCleaned,
        neverCleaned: copy.neverCleaned,
        minutes: copy.minutes,
        recurrenceDays: copy.recurrenceDays,
        section: copy.section,
      }}
    />
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
    reports: "التقارير والإحصائيات",
  };

  return (
    <Suspense fallback={<TabSkeleton />}>
      <AdminSpaContainer
        labels={tabLabels}
        homeTab={<HomeTab locale={locale} />}
        clientsTab={<ClientsTab locale={locale} />}
        staffTab={<StaffTab locale={locale} />}
        sectionsTab={
          <SectionsTab
            locale={locale}
            clientId={firstValue(sp.clientId)}
            sectionId={firstValue(sp.sectionId)}
          />
        }
        scheduleTab={<ScheduleTab locale={locale} month={firstValue(sp.month)} />}
        reportsTab={
          <ReportsTab
            locale={locale}
            clientId={firstValue(sp.clientId)}
            from={firstValue(sp.from)}
            to={firstValue(sp.to)}
          />
        }
      />
    </Suspense>
  );
}
