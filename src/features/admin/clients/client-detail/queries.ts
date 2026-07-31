import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type ClientDetailProfile = Readonly<{
  id: string;
  name: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactNotes: string;
  isActive: boolean;
  avatarPath: string | null;
}>;

export type ClientAssignedEmployee = Readonly<{
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}>;

export type ClientRecentPlan = Readonly<{
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  status: "in_progress" | "submitted";
  totalItems: number;
  completedItems: number;
}>;

export type ClientSectionSummary = Readonly<{
  id: string;
  name: string;
  parentSectionId: string | null;
  sortOrder: number;
  referenceImagePath: string | null;
}>;

export type ClientDetailData = Readonly<{
  ok: boolean;
  client: ClientDetailProfile | null;
  assignedEmployees: readonly ClientAssignedEmployee[];
  recentPlans: readonly ClientRecentPlan[];
  sections: readonly ClientSectionSummary[];
}>;

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  contact_info: z.unknown(),
  is_active: z.boolean(),
  avatar_path: z.string().nullable().optional(),
});

const AssignmentRowSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
});

const ProfileRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
});

const PlanRowSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  work_date: z.string(),
  status: z.string(),
});

const PlanItemRowSchema = z.object({
  daily_plan_id: z.string().uuid(),
  is_completed: z.boolean(),
});

const SectionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parent_section_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int(),
  reference_image_path: z.string().nullable().optional(),
});

function parseContactInfo(raw: unknown): {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactNotes: string;
} {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      contactEmail: typeof r["email"] === "string" ? r["email"] : "",
      contactName:
        typeof r["contact_name"] === "string" ? r["contact_name"] : "",
      contactNotes: typeof r["notes"] === "string" ? r["notes"] : "",
      contactPhone: typeof r["phone"] === "string" ? r["phone"] : "",
    };
  }
  return {
    contactEmail: "",
    contactName: "",
    contactNotes: "",
    contactPhone: "",
  };
}

function isActiveAssignment(startDate: string, endDate: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return startDate <= today && (!endDate || endDate >= today);
}

function emptyData(): ClientDetailData {
  return {
    assignedEmployees: [],
    client: null,
    ok: false,
    recentPlans: [],
    sections: [],
  };
}

export async function getClientDetailData(
  locale: Locale,
  clientId: string,
): Promise<ClientDetailData> {
  await requireRole(locale, "admin");

  const parsedId = z.string().uuid().safeParse(clientId);

  if (!parsedId.success) {
    return emptyData();
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("id, name, address, contact_info, is_active, avatar_path")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (clientError || !clientRow) {
      return emptyData();
    }

    const client = ClientRowSchema.safeParse(clientRow);

    if (!client.success) {
      return emptyData();
    }

    const [
      { data: assignmentRows, error: assignmentError },
      { data: planRows, error: planError },
      { data: sectionRows, error: sectionError },
    ] = await Promise.all([
      supabase
        .from("employee_client_assignments")
        .select("id, employee_id, start_date, end_date")
        .eq("client_id", parsedId.data)
        .order("start_date", { ascending: false }),
      supabase
        .from("daily_plans")
        .select("id, employee_id, work_date, status")
        .eq("client_id", parsedId.data)
        .order("work_date", { ascending: false })
        .limit(20),
      supabase
        .from("sections")
        .select("id, name, parent_section_id, sort_order, reference_image_path")
        .eq("client_id", parsedId.data)
        .order("sort_order", { ascending: true }),
    ]);

    const assignments = !assignmentError && assignmentRows
      ? (z.array(AssignmentRowSchema).safeParse(assignmentRows).data ?? [])
      : [];
    const plans = !planError && planRows
      ? (z.array(PlanRowSchema).safeParse(planRows).data ?? [])
      : [];
    const sections = !sectionError && sectionRows
      ? (z.array(SectionRowSchema).safeParse(sectionRows).data ?? [])
      : [];

    // Fetch employee names for assignments and plans
    const employeeIds = Array.from(
      new Set([
        ...assignments.map((row) => row.employee_id),
        ...plans.map((row) => row.employee_id),
      ]),
    );

    const { data: profileRows } = employeeIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", employeeIds)
      : { data: [] };

    const profiles = profileRows
      ? (z.array(ProfileRowSchema).safeParse(profileRows).data ?? [])
      : [];

    const employeeMap = new Map(
      profiles.map((p) => [p.id, p.full_name]),
    );

    // Fetch plan item counts
    const planIds = plans.map((row) => row.id);
    const { data: planItemRows } = planIds.length
      ? await supabase
          .from("daily_plan_items")
          .select("daily_plan_id, is_completed")
          .in("daily_plan_id", planIds)
      : { data: [] };

    const planItems = planItemRows
      ? (z.array(PlanItemRowSchema).safeParse(planItemRows).data ?? [])
      : [];

    const itemCountsByPlan = new Map<
      string,
      { total: number; completed: number }
    >();
    planItems.forEach((item) => {
      const existing = itemCountsByPlan.get(item.daily_plan_id) ?? {
        completed: 0,
        total: 0,
      };
      existing.total += 1;
      if (item.is_completed) existing.completed += 1;
      itemCountsByPlan.set(item.daily_plan_id, existing);
    });

    const contactInfo = parseContactInfo(client.data.contact_info);

    return {
      assignedEmployees: assignments.map((row) => ({
        employeeId: row.employee_id,
        employeeName: employeeMap.get(row.employee_id) ?? "",
        endDate: row.end_date ?? null,
        id: row.id,
        isActive: isActiveAssignment(row.start_date, row.end_date ?? null),
        startDate: row.start_date,
      })),
      client: {
        address: client.data.address,
        avatarPath: typeof client.data.avatar_path === "string" ? client.data.avatar_path : null,
        contactEmail: contactInfo.contactEmail,
        contactName: contactInfo.contactName,
        contactNotes: contactInfo.contactNotes,
        contactPhone: contactInfo.contactPhone,
        id: client.data.id,
        isActive: client.data.is_active,
        name: client.data.name,
      },
      ok: true,
      recentPlans: plans.map((row) => {
        const counts = itemCountsByPlan.get(row.id) ?? {
          completed: 0,
          total: 0,
        };
        return {
          completedItems: counts.completed,
          employeeId: row.employee_id,
          employeeName: employeeMap.get(row.employee_id) ?? "",
          id: row.id,
          status: row.status === "submitted" ? "submitted" : "in_progress",
          totalItems: counts.total,
          workDate: row.work_date,
        };
      }),
      sections: sections.map((row) => ({
        id: row.id,
        name: row.name,
        parentSectionId: row.parent_section_id ?? null,
        referenceImagePath: row.reference_image_path ?? null,
        sortOrder: row.sort_order,
      })),
    };
  } catch {
    return emptyData();
  }
}
