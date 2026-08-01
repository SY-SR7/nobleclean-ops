import { createClient } from "@/server/db/server";

export type AuditActionType =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "SCHEDULE"
  | "ASSIGN"
  | "ARCHIVE"
  | "RESTORE";

export interface LogAuditInput {
  action: AuditActionType;
  tableName: string;
  recordId?: string | null;
  description?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    diff?: {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    };
    _meta?: Record<string, unknown>;
  };
}

export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const cb: Record<string, unknown> = {};
  const ca: Record<string, unknown> = {};
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  for (const key of allKeys) {
    if (["updated_at", "created_at", "id"].includes(key)) continue;
    const bv = before[key] ?? null;
    const av = after[key] ?? null;
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      cb[key] = bv;
      ca[key] = av;
    }
  }
  return { before: cb, after: ca };
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const changes = {
      ...input.changes,
      _meta: {
        user_email: user?.email || "admin@nobleclean.de",
        description: input.description || `${input.action} in ${input.tableName}`,
        ...input.changes?._meta,
      },
    };

    if (input.action === "UPDATE" && input.changes?.before && input.changes?.after && !input.changes?.diff) {
      changes.diff = computeDiff(input.changes.before, input.changes.after);
    }

    await supabase.from("audit_logs").insert({
      user_id: user?.id || null,
      action: input.action,
      table_name: input.tableName,
      record_id: input.recordId ? String(input.recordId) : null,
      changes,
    });
  } catch {
    // Non-blocking audit log catch
  }
}
