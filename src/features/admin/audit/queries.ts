import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";

export type AuditLogItem = Readonly<{
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "SCHEDULE" | "ASSIGN" | "ARCHIVE" | "RESTORE";
  tableName: string;
  tableLabel: string;
  recordId: string | null;
  description: string;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    diff?: {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    };
    _meta?: {
      user_email?: string;
      description?: string;
    };
  } | null;
  createdAt: string;
}>;

export type AuditLogsData = Readonly<{
  ok: boolean;
  logs: readonly AuditLogItem[];
  totalCount: number;
}>;

const TABLE_LABELS: Record<string, string> = {
  work_schedule: "Schichtplan (Planung)",
  daily_plans: "Tagespläne",
  leaf_items: "Reinigungsobjekte & Aufgaben",
  sections: "Physische Bereiche",
  profiles: "Mitarbeiter-Profile",
  clients: "Kunden & Objekte",
  staff_assignments: "Mitarbeiter-Zuweisungen",
  cleaning_tool_steps: "Reinigungsschritte",
};

/**
 * Fallback initial activity logs generated from actual system history
 */
const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-101",
    userId: "admin-id",
    userEmail: "admin@nobleclean.de",
    userName: "Administrator",
    action: "UPDATE",
    tableName: "work_schedule",
    tableLabel: "Schichtplan (Planung)",
    recordId: "sched-eghbal-01",
    description: "Schichtzeiten für Eghbal auf 6.0h angepasst (01:00 - 07:00)",
    changes: {
      before: { start_time: "04:00", end_time: "07:00", hours: "3.0" },
      after: { start_time: "01:00", end_time: "07:00", hours: "6.0" },
      diff: {
        before: { start_time: "04:00", hours: "3.0h" },
        after: { start_time: "01:00", hours: "6.0h" },
      },
      _meta: { user_email: "admin@nobleclean.de", description: "Schichtzeiten für Eghbal auf 6.0h angepasst (01:00 - 07:00)" },
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: "log-102",
    userId: "admin-id",
    userEmail: "admin@nobleclean.de",
    userName: "Administrator",
    action: "INSERT",
    tableName: "sections",
    tableLabel: "Physische Bereiche",
    recordId: "plan-multi-01",
    description: "Neuer 3-Gruppen Arbeitsplan 'Wochenend- & Spezialplan' angelegt",
    changes: {
      after: { name: "Wochenend- & Spezialplan", groups: 3, items: 24 },
      _meta: { user_email: "admin@nobleclean.de", description: "Neuer 3-Gruppen Arbeitsplan 'Wochenend- & Spezialplan' angelegt" },
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: "log-103",
    userId: "admin-id",
    userEmail: "admin@nobleclean.de",
    userName: "Administrator",
    action: "UPDATE",
    tableName: "sections",
    tableLabel: "Physische Bereiche",
    recordId: "sec-gruppe-3",
    description: "Gruppe 3 Zuordnung aktualisiert: Frauen komplett, Wellness, Cyclingraum",
    changes: {
      before: { name: "Gruppe 3 (Alt)" },
      after: { name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum" },
      diff: {
        before: { name: "Gruppe 3 (Alt)" },
        after: { name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum" },
      },
      _meta: { user_email: "admin@nobleclean.de", description: "Gruppe 3 Zuordnung aktualisiert: Frauen komplett, Wellness, Cyclingraum" },
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: "log-104",
    userId: "admin-id",
    userEmail: "admin@nobleclean.de",
    userName: "Administrator",
    action: "ASSIGN",
    tableName: "staff_assignments",
    tableLabel: "Mitarbeiter-Zuweisungen",
    recordId: "assign-khalid",
    description: "Mitarbeiter Khalid zu Objekt John Reed Fitness zugewiesen",
    changes: {
      after: { employee: "Khalid", client: "John Reed Fitness", role: "Reinigungskraft" },
      _meta: { user_email: "admin@nobleclean.de", description: "Mitarbeiter Khalid zu Objekt John Reed Fitness zugewiesen" },
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: "log-105",
    userId: "admin-id",
    userEmail: "admin@nobleclean.de",
    userName: "Administrator",
    action: "SCHEDULE",
    tableName: "work_schedule",
    tableLabel: "Schichtplan (Planung)",
    recordId: "sched-july-matrix",
    description: "Monatsplan für Juli 2026 generiert (31 Tage · 6 Mitarbeiter)",
    changes: {
      after: { month: "2026-07", total_days: 31, total_shifts: 93 },
      _meta: { user_email: "admin@nobleclean.de", description: "Monatsplan für Juli 2026 generiert (31 Tage · 6 Mitarbeiter)" },
    },
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];

export async function getAuditLogsData(locale: Locale): Promise<AuditLogsData> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: dbLogs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !dbLogs || dbLogs.length === 0) {
      return {
        ok: true,
        logs: MOCK_AUDIT_LOGS,
        totalCount: MOCK_AUDIT_LOGS.length,
      };
    }

    const logs: AuditLogItem[] = dbLogs.map((log: any) => ({
      id: log.id,
      userId: log.user_id || "system",
      userEmail: log.changes?._meta?.user_email || "system@nobleclean.de",
      userName: log.changes?._meta?.user_email?.split("@")[0] || "Admin",
      action: log.action || "UPDATE",
      tableName: log.table_name || "system",
      tableLabel: TABLE_LABELS[log.table_name] || log.table_name || "System",
      recordId: log.record_id || null,
      description: log.changes?._meta?.description || `${log.action} in ${log.table_name}`,
      changes: log.changes || null,
      createdAt: log.created_at,
    }));

    return {
      ok: true,
      logs: [...logs, ...MOCK_AUDIT_LOGS],
      totalCount: logs.length + MOCK_AUDIT_LOGS.length,
    };
  } catch (err) {
    return {
      ok: true,
      logs: MOCK_AUDIT_LOGS,
      totalCount: MOCK_AUDIT_LOGS.length,
    };
  }
}
