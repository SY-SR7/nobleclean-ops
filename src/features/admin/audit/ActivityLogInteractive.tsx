"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User,
  Search,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from "lucide-react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { useToast } from "@/components/ui/toast";
import type { AuditLogItem } from "./queries";
import type { Locale } from "@/i18n/routing";

type ActivityLogInteractiveProps = Readonly<{
  logs: readonly AuditLogItem[];
  locale: Locale;
}>;

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  INSERT: {
    label: "Hinzugefügt (إضافة)",
    icon: Plus,
    color: "text-emerald-700",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  UPDATE: {
    label: "Bearbeitet (تعديل)",
    icon: Edit3,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  DELETE: {
    label: "Gelöscht (حذف)",
    icon: Trash2,
    color: "text-red-700",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  SCHEDULE: {
    label: "Schichtplan (تجديد جدول)",
    icon: Calendar,
    color: "text-purple-700",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  ASSIGN: {
    label: "Zuweisung (تعيين موظف)",
    icon: User,
    color: "text-teal-700",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  ARCHIVE: {
    label: "Archiviert (أرشفة)",
    icon: Layers,
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  RESTORE: {
    label: "Wiederhergestellt (استعادة)",
    icon: ShieldCheck,
    color: "text-indigo-700",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
};

function formatDateLabel(isoStr: string, locale: Locale) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function timeAgo(isoStr: string) {
  const d = new Date(isoStr);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag(en)`;
}

export function ActivityLogInteractive({ logs, locale }: ActivityLogInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();

  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Toggle expanded log card details
  const toggleExpand = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  // Filter logs by Action & Search Query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action filter
      if (selectedActionFilter !== "ALL" && log.action !== selectedActionFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${log.description} ${log.userName} ${log.userEmail} ${log.tableName} ${log.tableLabel} ${log.action}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [logs, selectedActionFilter, searchQuery]);

import { exportToCSV, exportToPDF } from "@/lib/export-utils";
import { FileSpreadsheet, Printer } from "lucide-react";

  const handleExportPDF = () => {
    if (filteredLogs.length === 0) {
      toast("Keine Daten zum Drucken vorhanden!", "error");
      return;
    }
    const headers = ["Datum & Zeit", "Aktion", "Bereich", "Benutzer", "Beschreibung"];
    const rows = filteredLogs.map((l) => [
      formatDateLabel(l.createdAt, locale),
      l.action,
      l.tableLabel,
      l.userName,
      l.description,
    ]);
    exportToPDF("System-Aktivitätsprotokoll (Audit Trail)", "Vollständige Nachverfolgung aller Systemänderungen", headers, rows, "nobleclean_aktivitaetsprotokoll.pdf");
  };

  // Drawer details view
  const openLogDrawer = (log: AuditLogItem) => {
    const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE!;
    const Icon = actionCfg.icon;

    const diffEntries = log.changes?.diff
      ? Object.keys(log.changes.diff.after || {}).map((k) => ({
          key: k,
          before: (log.changes?.diff?.before as any)?.[k] ?? "—",
          after: (log.changes?.diff?.after as any)?.[k] ?? "—",
        }))
      : [];

    const config: DrawerConfig = {
      title: log.tableLabel,
      subtitle: `${formatDateLabel(log.createdAt, locale)} · ${log.userName}`,
      icon: <Icon className={`size-6 ${actionCfg.color}`} />,
      accentColor: "secondary",
      badge: {
        label: actionCfg.label.split("(")[0]!.trim(),
        variant: log.action === "DELETE" ? "critical" : log.action === "INSERT" ? "success" : "neutral",
      },
      kpis: [
        { label: "Aktion", value: log.action, color: "text-secondary" },
        { label: "Benutzer", value: log.userName, color: "text-purple-600" },
        { label: "Bereich", value: log.tableName, color: "text-emerald-600" },
      ],
      sections: [
        {
          label: "Beschreibung der Änderung",
          content: (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
              <p className="font-extrabold text-sm text-on-surface">{log.description}</p>
              <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                <Clock className="size-3.5" /> {formatDateLabel(log.createdAt, locale)} ({timeAgo(log.createdAt)})
              </p>
            </div>
          ),
        },
        ...(diffEntries.length > 0
          ? [
              {
                label: "Feldübergreifende Änderungen (Diff)",
                content: (
                  <div className="space-y-2">
                    {diffEntries.map((diff, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-on-surface">{diff.key}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 bg-red-500/10 px-2 py-0.5 rounded font-semibold line-through">
                            {String(diff.before)}
                          </span>
                          <ArrowRight className="size-3 text-on-surface-variant" />
                          <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded font-extrabold">
                            {String(diff.after)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]
          : []),
      ],
    };
    open(config);
  };

  return (
    <div className="grid gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-4">
        <div>
          <span className="text-xs font-extrabold uppercase text-secondary tracking-wider flex items-center gap-1.5 mb-1">
            <Activity className="size-4" /> Audit Trail & System-Protokoll
          </span>
          <h2 className="text-2xl font-extrabold text-on-surface">
            Aktivitätsprotokoll
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Lückenlose Nachverfolgung aller Änderungen, Termine, Zuweisungen und Aktionen im System.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/70 px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
        >
          <Download className="size-4 text-secondary" /> Tabelle als CSV exportieren
        </button>
      </div>

      {/* Action Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedActionFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 border shrink-0 ${
            selectedActionFilter === "ALL"
              ? "bg-secondary text-on-secondary border-secondary shadow-md"
              : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-container"
          }`}
        >
          <Filter className="size-3.5" />
          <span>Alle Aktionen ({logs.length})</span>
        </button>

        {Object.entries(ACTION_CONFIG).map(([actionKey, cfg]) => {
          const count = logs.filter((l) => l.action === actionKey).length;
          const isSelected = selectedActionFilter === actionKey;
          const Icon = cfg.icon;

          return (
            <button
              key={actionKey}
              type="button"
              onClick={() => setSelectedActionFilter(actionKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 border shrink-0 ${
                isSelected
                  ? "bg-secondary text-on-secondary border-secondary shadow-md"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-container"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{cfg.label.split("(")[0]}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? "bg-white/20" : "bg-secondary/10 text-secondary"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen nach Mitarbeiter, Aktion, Bereich oder Details..."
          className="w-full h-12 px-4 pl-11 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-xs font-bold focus:border-secondary outline-none shadow-sm transition"
        />
        <Search className="size-4 text-on-surface-variant absolute top-4 left-4 pointer-events-none" />
      </div>

      {/* Audit Logs List Grid */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant text-sm font-bold">
            Keine Aktivitäten für die ausgewählten Filter gefunden.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE!;
            const Icon = actionCfg.icon;
            const isExpanded = expandedLogIds.has(log.id);

            const diffEntries = log.changes?.diff
              ? Object.keys(log.changes.diff.after || {}).map((k) => ({
                  key: k,
                  before: (log.changes?.diff?.before as any)?.[k] ?? "—",
                  after: (log.changes?.diff?.after as any)?.[k] ?? "—",
                }))
              : [];

            return (
              <div
                key={log.id}
                className="group rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4.5 shadow-sm hover:shadow-md hover:border-secondary transition-all"
              >
                {/* Main Log Card Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Action Icon Badge */}
                    <div
                      className={`size-11 rounded-2xl border ${actionCfg.border} ${actionCfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon className={`size-5 ${actionCfg.color}`} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${actionCfg.border} ${actionCfg.bg} ${actionCfg.color}`}>
                          {actionCfg.label.split("(")[0]}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">
                          {log.tableLabel}
                        </span>
                        <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                          <User className="size-3 text-secondary" /> {log.userName}
                        </span>
                      </div>

                      <p className="font-extrabold text-sm text-on-surface group-hover:text-secondary transition-colors">
                        {log.description}
                      </p>

                      <p className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                        <Clock className="size-3" /> {formatDateLabel(log.createdAt, locale)} · ({timeAgo(log.createdAt)})
                      </p>
                    </div>
                  </div>

                  {/* Actions & Expand Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openLogDrawer(log)}
                      className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-extrabold rounded-xl transition cursor-pointer"
                    >
                      Details
                    </button>
                    {diffEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="p-2 rounded-xl border border-outline-variant/60 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition cursor-pointer"
                        title="Änderungsdetails anzeigen"
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Field Diff Viewer */}
                {isExpanded && diffEntries.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-outline-variant/50 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[10px] font-extrabold uppercase text-secondary tracking-wider mb-2">
                      Feldübergreifende Änderungen (Diff):
                    </p>
                    {diffEntries.map((diff, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-on-surface">{diff.key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 bg-red-500/10 px-2 py-0.5 rounded font-semibold line-through">
                            {String(diff.before)}
                          </span>
                          <ArrowRight className="size-3 text-on-surface-variant" />
                          <span className="text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded font-extrabold">
                            {String(diff.after)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
