"use client";

import {
  ArrowRight,
  Building2,
  Users,
  Layers,
  CalendarDays,
  BarChart3,
  Clock,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle,
  Plus,
  Radio,
  FileSpreadsheet,
} from "lucide-react";
import { useCallback, useState } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { MetricCard } from "@/components/ui";
import { useAdminSpa, type AdminTab } from "@/context/admin-spa-context";
import type {
  AdminHomeData,
  DetailClientItem,
  DetailStaffItem,
  DetailScheduleItem,
  DetailDueItem,
} from "./queries";
import type { Locale } from "@/i18n/routing";

type HomeInteractiveProps = Readonly<{
  data: AdminHomeData;
  locale: Locale;
  copy: {
    activeAssignments: string;
    activeClients: string;
    attentionItems: string;
    client: string;
    complaint: string;
    dueItems: string;
    employee: string;
    employees: string;
    emptyRecent: string;
    highPriority: string;
    hours: string;
    mandatoryEscalations: string;
    openPlans: string;
    recentWork: string;
    sectionAttention: string;
    sectionWorkflows: string;
    subtitle: string;
    title: string;
    todaySchedule: string;
    totalItems: string;
    viewClients: string;
    viewReports: string;
    workflowClients: string;
    workflowReports: string;
    workflowSchedule: string;
    workflowSectionsItems: string;
    workflowStaff: string;
  };
}>;

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

export function HomeInteractive({ data, locale, copy }: HomeInteractiveProps) {
  const { setActiveTab } = useAdminSpa();
  const { open, close } = useDetailDrawer();

  // Sub-Modal States for Nested Interactivity
  const [selectedSubClient, setSelectedSubClient] = useState<DetailClientItem | null>(null);
  const [selectedSubStaff, setSelectedSubStaff] = useState<DetailStaffItem | null>(null);
  const [selectedSubSchedule, setSelectedSubSchedule] = useState<DetailScheduleItem | null>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<DetailDueItem | null>(null);

  // 1. OPEN CLIENTS MODAL & DEEP-DIVE SUB-MODAL
  const openClientsModal = useCallback(() => {
    const config: DrawerConfig = {
      title: "Aktive Kunden — Übersicht & Details",
      subtitle: `${data.clientsList.length} Kunden registriert im System`,
      icon: <Building2 className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${data.activeClientCount} Aktiv`,
        variant: "success",
      },
      kpis: [
        { label: "Aktive Kunden", value: data.activeClientCount, color: "text-emerald-600" },
        { label: "Gesamt Kunden", value: data.clientsList.length, color: "text-blue-600" },
      ],
      sections: [
        {
          label: "Kundenliste (Klicken für Details & Aktionen)",
          content: (
            <div className="grid gap-2.5">
              {data.clientsList.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedSubClient(client)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">
                        {client.name}
                      </p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="size-3 shrink-0" /> {client.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full">
                      Aktiv
                    </span>
                    <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ),
        },
      ],
      footer: (
        <button
          type="button"
          onClick={() => {
            close();
            setActiveTab("clients");
          }}
          className="w-full bg-secondary text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-90 transition cursor-pointer"
        >
          <span>Zur Kundenverwaltung wechseln</span>
          <ArrowRight className="size-4" />
        </button>
      ),
    };
    open(config);
  }, [data.clientsList, data.activeClientCount, open, close, setActiveTab]);

  // 2. OPEN STAFF ASSIGNMENTS MODAL
  const openStaffModal = useCallback(() => {
    const config: DrawerConfig = {
      title: "Aktive Zuweisungen & Personal-Übersicht",
      subtitle: `${data.staffList.length} Mitarbeiter im Team`,
      icon: <Users className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${data.activeAssignmentCount} Zuweisungen`,
        variant: "success",
      },
      kpis: [
        { label: "Mitarbeiter", value: data.staffList.length, color: "text-blue-600" },
        { label: "Zuweisungen", value: data.activeAssignmentCount, color: "text-violet-600" },
      ],
      sections: [
        {
          label: "Teamliste (Klicken für Profil & Schichten)",
          content: (
            <div className="grid gap-2.5">
              {data.staffList.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedSubStaff(emp)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      {emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" /> Standard: {emp.defaultDailyHours} Std. / Tag
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-700 px-2.5 py-1 rounded-full">
                      Mitarbeiter
                    </span>
                    <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ),
        },
      ],
      footer: (
        <button
          type="button"
          onClick={() => {
            close();
            setActiveTab("staff");
          }}
          className="w-full bg-secondary text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-90 transition cursor-pointer"
        >
          <span>Zur Teamverwaltung wechseln</span>
          <ArrowRight className="size-4" />
        </button>
      ),
    };
    open(config);
  }, [data.staffList, data.activeAssignmentCount, open, close, setActiveTab]);

  // 3. OPEN TODAY SCHEDULE MODAL
  const openScheduleModal = useCallback(() => {
    const config: DrawerConfig = {
      title: "Heutiger Schichtplan — Tagesübersicht",
      subtitle: `${data.todayScheduleCount} Schichten heute · ${data.todayAllocatedHours} Std. gesamt`,
      icon: <CalendarDays className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${data.todayAllocatedHours} Stunden`,
        variant: "success",
      },
      kpis: [
        { label: "Schichten Heute", value: data.todayScheduleCount, color: "text-emerald-600" },
        { label: "Stunden Gesamt", value: `${data.todayAllocatedHours}h`, color: "text-blue-600" },
      ],
      sections: [
        {
          label: "Heutiges Team & Schichten (Klicken für Details)",
          content: (
            <div className="grid gap-2.5">
              {data.todaySchedulesList.length > 0 ? (
                data.todaySchedulesList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSubSchedule(item)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                        <CalendarDays className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">
                          {item.employeeName}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="size-3 shrink-0" /> {item.clientName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
                        {item.allocatedHours} Std.
                      </span>
                      <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant p-4 bg-surface-container-low rounded-xl text-center">
                  Keine Schichten für heute eingetragen.
                </p>
              )}
            </div>
          ),
        },
      ],
      footer: (
        <button
          type="button"
          onClick={() => {
            close();
            setActiveTab("schedule");
          }}
          className="w-full bg-secondary text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-90 transition cursor-pointer"
        >
          <span>Zum Schichtplan wechseln</span>
          <ArrowRight className="size-4" />
        </button>
      ),
    };
    open(config);
  }, [data.todayScheduleCount, data.todayAllocatedHours, data.todaySchedulesList, open, close, setActiveTab]);

  // 4. OPEN DUE ITEMS MODAL
  const openDueItemsModal = useCallback(() => {
    const config: DrawerConfig = {
      title: "Fällige Aufgaben & Objekt-Übersicht",
      subtitle: `${data.dueItemCount} von ${data.totalLeafItemCount} Objekten heute fällig`,
      icon: <Layers className="size-6 text-secondary" />,
      accentColor: "warning",
      badge: {
        label: `${data.dueItemCount} Fällig`,
        variant: "warning",
      },
      kpis: [
        { label: "Fällige Aufgaben", value: data.dueItemCount, color: "text-amber-600" },
        { label: "Gesamt Objekte", value: data.totalLeafItemCount, color: "text-blue-600" },
      ],
      sections: [
        {
          label: "Fällige Reinigungs-Objekte (Klicken für Details)",
          content: (
            <div className="grid gap-2.5">
              {data.dueItemsList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSubTask(item)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      <Layers className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" /> Dauer: ca. {item.estimatedMinutes} Min.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant">
                      {item.tag}
                    </span>
                    <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ),
        },
      ],
      footer: (
        <button
          type="button"
          onClick={() => {
            close();
            setActiveTab("sections");
          }}
          className="w-full bg-secondary text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-90 transition cursor-pointer"
        >
          <span>Zu Bereichen & Objekten wechseln</span>
          <ArrowRight className="size-4" />
        </button>
      ),
    };
    open(config);
  }, [data.dueItemCount, data.totalLeafItemCount, data.dueItemsList, open, close, setActiveTab]);

  // 5. OPEN ATTENTION ITEMS MODAL
  const openAttentionModal = useCallback(() => {
    const config: DrawerConfig = {
      title: "Wichtige Hinweise & Reklamationen",
      subtitle: `${data.highPriorityItemCount} Priorität · ${data.complaintItemCount} Reklamationen`,
      icon: <AlertTriangle className="size-6 text-rose-600" />,
      accentColor: "critical",
      badge: {
        label: `${data.attentionItemCount} Wichtig`,
        variant: "critical",
      },
      kpis: [
        { label: "Hohe Priorität", value: data.highPriorityItemCount, color: "text-amber-600" },
        { label: "Reklamationen", value: data.complaintItemCount, color: "text-rose-600" },
      ],
      sections: [
        {
          label: "Prioritäts-Objekte & Reklamationen (Klicken für Details)",
          content: (
            <div className="grid gap-2.5">
              {data.attentionItemsList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSubTask(item)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface group-hover:text-rose-700 transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-rose-800 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="size-3" /> Priorität: {item.tag === "high_priority" ? "Hoch" : "Reklamation"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-rose-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          ),
        },
      ],
      footer: (
        <button
          type="button"
          onClick={() => {
            close();
            setActiveTab("reports");
          }}
          className="w-full bg-rose-600 text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-rose-700 transition cursor-pointer"
        >
          <span>Zu den Berichten & Analysen</span>
          <ArrowRight className="size-4" />
        </button>
      ),
    };
    open(config);
  }, [data.highPriorityItemCount, data.complaintItemCount, data.attentionItemCount, data.attentionItemsList, open, close, setActiveTab]);

  // 6. OPEN RECENT PLAN DRAWER
  const openPlanDrawer = useCallback(
    (plan: (typeof data.recentPlans)[number]) => {
      const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
      const isSubmitted = plan.status === "submitted";
      const config: DrawerConfig = {
        title: plan.employeeName,
        subtitle: `${plan.clientName} · ${formatDate(plan.workDate, locale)}`,
        icon: <BarChart3 className="size-6 text-secondary" />,
        accentColor: isSubmitted ? "success" : "warning",
        badge: {
          label: isSubmitted ? "Abgeschlossen" : "In Bearbeitung",
          variant: isSubmitted ? "success" : "warning",
        },
        kpis: [
          { label: "Fortschritt", value: `${pct}%`, color: "text-secondary" },
          { label: "Erledigt", value: `${plan.completedItems}/${plan.totalItems}`, color: "text-emerald-600" },
        ],
        sections: [
          {
            label: "Plan-Details & Status",
            content: (
              <div className="grid gap-3">
                <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60">
                  <span className="text-xs uppercase font-extrabold text-on-surface-variant">Fortschritts-Balken</span>
                  <span className="font-heading text-xl font-extrabold text-secondary">{pct}%</span>
                </div>
                <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden p-0.5 border border-outline-variant/60">
                  <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">{copy.employee}</span>
                    <p className="text-sm font-extrabold mt-0.5 text-on-surface">{plan.employeeName}</p>
                  </div>
                  <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">{copy.client}</span>
                    <p className="text-sm font-extrabold mt-0.5 text-on-surface">{plan.clientName}</p>
                  </div>
                </div>
              </div>
            ),
          },
        ],
        footer: (
          <button
            type="button"
            onClick={() => {
              close();
              setActiveTab("reports");
            }}
            className="w-full bg-secondary text-white py-3 rounded-2xl font-extrabold flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-90 transition cursor-pointer"
          >
            <span>Berichte anzeigen</span>
            <ArrowRight className="size-4" />
          </button>
        ),
      };
      open(config);
    },
    [open, locale, copy, close, setActiveTab],
  );

  const workflows: { id: AdminTab; label: string; description: string; icon: React.ReactNode }[] = [
    { id: "clients", label: copy.activeClients, description: copy.workflowClients, icon: <Building2 className="size-5 text-secondary" /> },
    { id: "staff", label: copy.activeAssignments, description: copy.workflowStaff, icon: <Users className="size-5 text-secondary" /> },
    { id: "sections", label: copy.dueItems, description: copy.workflowSectionsItems, icon: <Layers className="size-5 text-secondary" /> },
    { id: "schedule", label: copy.todaySchedule, description: copy.workflowSchedule, icon: <CalendarDays className="size-5 text-secondary" /> },
    { id: "reports", label: copy.viewReports, description: copy.workflowReports, icon: <BarChart3 className="size-5 text-secondary" /> },
  ];

  return (
    <div className="grid gap-6">
      {/* ── Executive Hero Command Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-secondary/90 to-primary-container p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide border border-white/20">
              <Radio className="size-3.5 text-emerald-400 animate-pulse" />
              <span>System Status: 100% Operational · Live Sync</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Willkommen zurück, Administrator!
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Echtzeit-Zentrale für Gebäude-Reinigung, Schichtpläne und Qualitätskontrolle.
            </p>
          </div>

          {/* Quick Action Shortcuts Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className="bg-white text-secondary hover:bg-white/90 transition px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-4" /> Schicht anlegen
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clients")}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="size-4" /> Kunde hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* ── Luxury Metric Cards Grid ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Card 1: Active Clients */}
        <button type="button" onClick={openClientsModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.activeClients} metadata={copy.viewClients} statusTone="success" value={data.activeClientCount} />
        </button>

        {/* Card 2: Active Staff Assignments */}
        <button type="button" onClick={openStaffModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.activeAssignments} metadata={`${data.employeeCount} ${copy.employees}`} statusTone="recent" value={data.activeAssignmentCount} />
        </button>

        {/* Card 3: Today's Schedule */}
        <button type="button" onClick={openScheduleModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.todaySchedule} metadata={`${formatHours(data.todayAllocatedHours, locale)} ${copy.hours}`} statusTone={data.todayScheduleCount > 0 ? "success" : "warning"} value={data.todayScheduleCount} />
        </button>

        {/* Card 4: Due Cleaning Items */}
        <button type="button" onClick={openDueItemsModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.dueItems} metadata={`${data.totalLeafItemCount} ${copy.totalItems}`} statusTone={data.dueItemCount > 0 ? "warning" : "recent"} value={data.dueItemCount} />
        </button>

        {/* Card 5: High Priority & Complaints */}
        <button type="button" onClick={openAttentionModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.attentionItems} metadata={`${data.highPriorityItemCount} ${copy.highPriority} / ${data.complaintItemCount} ${copy.complaint}`} statusTone={data.attentionItemCount > 0 ? "critical" : "recent"} value={data.attentionItemCount} />
        </button>

        {/* Card 6: Mandatory Step Escalations */}
        <button type="button" onClick={openAttentionModal} className="block group text-left cursor-pointer">
          <MetricCard label={copy.mandatoryEscalations} metadata={copy.viewReports} statusTone={data.mandatoryStepEscalationCount > 0 ? "critical" : "recent"} value={data.mandatoryStepEscalationCount} />
        </button>
      </div>

      {/* ── Client Operational Health Overview ── */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-primary-container text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-secondary" /> Kunden-Status & Abdeckung
          </h2>
          <button
            type="button"
            onClick={openClientsModal}
            className="text-xs font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1"
          >
            Alle Kunden anzeigen <ArrowRight className="size-3.5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {data.clientSummaries.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={openClientsModal}
              className="p-5 rounded-3xl border border-outline-variant/60 bg-surface-container-lowest hover:border-secondary hover:shadow-lg transition-all text-left cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <Building2 className="size-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Optimal
                </span>
              </div>
              <div>
                <p className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors">
                  {client.name}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {client.sectionsCount} Bereiche · {client.staffCount} Mitarbeiter eingeplant
                </p>
              </div>
              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                <span>Fällige Aufgaben</span>
                <span className="font-bold text-secondary">{client.dueTasksCount} Objekte</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Activity Grid ── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        {/* Recent Activity */}
        <section className="grid h-fit gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">{copy.recentWork}</h2>
          {data.recentPlans.length > 0 ? (
            <div className="grid gap-3">
              {data.recentPlans.map((plan) => {
                const pct = plan.totalItems > 0 ? Math.round((plan.completedItems / plan.totalItems) * 100) : 0;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => openPlanDrawer(plan)}
                    className="border-outline-variant bg-surface-container-lowest group block w-full text-left rounded-2xl border p-4 transition-all hover:border-secondary hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                          {plan.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-on-surface group-hover:text-secondary text-sm font-extrabold transition-colors truncate">{plan.employeeName}</p>
                          <p className="text-on-surface-variant text-xs mt-0.5 truncate">{plan.clientName} · {formatDate(plan.workDate, locale)}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-heading text-secondary text-lg font-bold">{pct}%</p>
                        <p className="text-on-surface-variant text-xs">{plan.completedItems}/{plan.totalItems} Aufgaben</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-4 py-6 text-sm">{copy.emptyRecent}</p>
          )}
        </section>

        {/* Attention Items Summary & Quick Performance Status */}
        <section className="grid h-fit gap-4">
          <div className="grid gap-3">
            <h2 className="font-heading text-primary-container text-xl font-bold">{copy.sectionAttention}</h2>
            {[
              { label: copy.mandatoryEscalations, value: data.mandatoryStepEscalationCount, action: openAttentionModal },
              { label: copy.openPlans, value: data.openPlanCount, action: openScheduleModal },
              { label: copy.dueItems, value: data.dueItemCount, action: openDueItemsModal },
            ].map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={row.action}
                className="border-outline-variant bg-surface-container-lowest group flex w-full items-center justify-between rounded-2xl border p-4 transition-all hover:border-secondary hover:shadow-sm text-left cursor-pointer"
              >
                <span className="text-on-surface group-hover:text-secondary text-sm font-bold transition-colors">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-on-surface text-lg font-extrabold">{row.value}</span>
                  <ArrowRight className="text-on-surface-variant size-4 group-hover:text-secondary transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* Operational Progress Card */}
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-on-surface-variant tracking-wider flex items-center gap-1.5">
                <Activity className="size-4 text-emerald-600" /> Tages-Fortschritt
              </span>
              <span className="text-sm font-extrabold text-emerald-700">{data.todayCompletionRate}%</span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${data.todayCompletionRate}%` }} />
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {data.todayScheduleCount} Schichten heute aktiv · {data.todayAllocatedHours} Std. geplante Arbeitszeit.
            </p>
          </div>
        </section>
      </div>

      {/* Quick Workflows Section */}
      <section className="grid gap-3">
        <h2 className="font-heading text-primary-container text-xl font-bold">{copy.sectionWorkflows}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workflows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="border-outline-variant bg-surface-container-lowest group flex flex-col gap-2 rounded-2xl border p-4 transition-all hover:border-secondary hover:shadow-md text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                {item.icon}
                <ArrowRight className="text-secondary size-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-on-surface group-hover:text-secondary text-sm font-bold transition-colors mt-1">{item.label}</p>
              <p className="text-on-surface-variant text-xs">{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── SUB-MODAL 1: Client Deep-Dive Window ── */}
      {selectedSubClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border-outline-variant flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-primary-container text-lg font-bold">{selectedSubClient.name}</h3>
                  <p className="text-xs text-on-surface-variant">Kunden-Stammdaten & Kontakt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubClient(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold cursor-pointer transition border border-outline-variant/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Adresse & Standort</p>
                <p className="font-semibold text-on-surface flex items-center gap-2">
                  <MapPin className="size-4 text-secondary" /> {selectedSubClient.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60">
                  <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Telefon</p>
                  <p className="font-bold text-on-surface text-xs mt-1 flex items-center gap-1.5">
                    <Phone className="size-3.5 text-secondary" /> {selectedSubClient.phone}
                  </p>
                </div>
                <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60">
                  <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">E-Mail</p>
                  <p className="font-bold text-on-surface text-xs mt-1 truncate flex items-center gap-1.5">
                    <Mail className="size-3.5 text-secondary" /> {selectedSubClient.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubClient(null);
                  close();
                  setActiveTab("sections");
                }}
                className="flex-1 bg-secondary text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
              >
                <Layers className="size-4" /> Bereiche anzeigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-MODAL 2: Staff Deep-Dive Window ── */}
      {selectedSubStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border-outline-variant flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedSubStaff.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading text-primary-container text-lg font-bold">{selectedSubStaff.fullName}</h3>
                  <p className="text-xs text-on-surface-variant">Mitarbeiter-Profil & Vorgaben</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubStaff(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold cursor-pointer transition border border-outline-variant/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Rolle im System</p>
                <p className="font-extrabold text-on-surface text-sm capitalize">{selectedSubStaff.role}</p>
              </div>
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Standard-Arbeitsstunden</p>
                <p className="font-extrabold text-secondary text-base">{selectedSubStaff.defaultDailyHours} Stunden / Tag</p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubStaff(null);
                  close();
                  setActiveTab("staff");
                }}
                className="flex-1 bg-secondary text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
              >
                <Users className="size-4" /> Personal-Details öffnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-MODAL 3: Schedule Deep-Dive Window ── */}
      {selectedSubSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border-outline-variant flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-primary-container text-lg font-bold">{selectedSubSchedule.employeeName}</h3>
                  <p className="text-xs text-on-surface-variant">Schicht-Details für heute</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubSchedule(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold cursor-pointer transition border border-outline-variant/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Zugewiesener Kunde</p>
                <p className="font-extrabold text-on-surface text-base flex items-center gap-2">
                  <Building2 className="size-4 text-secondary" /> {selectedSubSchedule.clientName}
                </p>
              </div>
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Zugewiesene Stunden</p>
                <p className="font-extrabold text-emerald-700 text-lg">{selectedSubSchedule.allocatedHours} Std.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubSchedule(null);
                  close();
                  setActiveTab("schedule");
                }}
                className="flex-1 bg-secondary text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
              >
                <CalendarDays className="size-4" /> Schichtplan öffnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-MODAL 4: Task Deep-Dive Window ── */}
      {selectedSubTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border-outline-variant flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-primary-container text-lg font-bold">{selectedSubTask.name}</h3>
                  <p className="text-xs text-on-surface-variant">Objekt & Reinigungs-Schritt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubTask(null)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold cursor-pointer transition border border-outline-variant/60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Geschätzte Dauer</p>
                <p className="font-extrabold text-on-surface text-base flex items-center gap-2">
                  <Clock className="size-4 text-secondary" /> {selectedSubTask.estimatedMinutes} Minuten
                </p>
              </div>
              <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/60 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider">Priorität & Tag</p>
                <span className="inline-block font-extrabold text-xs bg-amber-500/20 text-amber-900 px-3 py-1 rounded-full border border-amber-500/30 uppercase mt-1">
                  {selectedSubTask.tag}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubTask(null);
                  close();
                  setActiveTab("sections");
                }}
                className="flex-1 bg-secondary text-white py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
              >
                <Layers className="size-4" /> Zu den Bereichen wechseln
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
