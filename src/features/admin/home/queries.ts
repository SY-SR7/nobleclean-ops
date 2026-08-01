import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type RecentAdminPlan = Readonly<{
  clientName: string;
  completedItems: number;
  employeeName: string;
  id: string;
  status: "in_progress" | "submitted";
  submittedAt: string | null;
  totalItems: number;
  workDate: string;
}>;

export type DetailClientItem = Readonly<{
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}>;

export type DetailStaffItem = Readonly<{
  id: string;
  fullName: string;
  role: string;
  defaultDailyHours: number;
}>;

export type DetailScheduleItem = Readonly<{
  id: string;
  employeeName: string;
  clientName: string;
  allocatedHours: number;
  workDate: string;
}>;

export type DetailDueItem = Readonly<{
  id: string;
  name: string;
  tag: "normal" | "complaint" | "high_priority";
  estimatedMinutes: number;
}>;

export type AdminHomeData = Readonly<{
  activeAssignmentCount: number;
  activeClientCount: number;
  attentionItemCount: number;
  complaintItemCount: number;
  dueItemCount: number;
  employeeCount: number;
  highPriorityItemCount: number;
  mandatoryStepEscalationCount: number;
  ok: boolean;
  openPlanCount: number;
  recentPlans: readonly RecentAdminPlan[];
  todayAllocatedHours: number;
  todayScheduleCount: number;
  totalLeafItemCount: number;
  // Detailed collections for interactive modals
  clientsList: readonly DetailClientItem[];
  staffList: readonly DetailStaffItem[];
  todaySchedulesList: readonly DetailScheduleItem[];
  dueItemsList: readonly DetailDueItem[];
  attentionItemsList: readonly DetailDueItem[];
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

const LeafItemRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  recurrence_days: z.number().int().min(1).nullable(),
  estimated_minutes: z.number(),
  tag: z.enum(["normal", "complaint", "high_priority"]),
});

const LastCleanedRowSchema = z.object({
  last_cleaned_at: z.string().nullable(),
  leaf_item_id: z.string().uuid(),
});

const ScheduleRowSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  client_id: z.string().uuid(),
  allocated_hours: z.number(),
  work_date: z.string(),
});

const RecentPlanRowSchema = z.object({
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  id: z.string().uuid(),
  status: z.enum(["in_progress", "submitted"]),
  submitted_at: z.string().nullable(),
  work_date: z.string(),
});

const DailyPlanItemRowSchema = z.object({
  daily_plan_id: z.string().uuid(),
  is_completed: z.boolean(),
});

const ProfileRowSchema = z.object({
  full_name: z.string(),
  id: z.string().uuid(),
  role: z.string(),
  default_daily_hours: z.number().nullable(),
});

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  contact_info: z.record(z.string(), z.unknown()).nullable(),
  is_active: z.boolean(),
});

function initialData(): AdminHomeData {
  return {
    activeAssignmentCount: 0,
    activeClientCount: 0,
    attentionItemCount: 0,
    complaintItemCount: 0,
    dueItemCount: 0,
    employeeCount: 0,
    highPriorityItemCount: 0,
    mandatoryStepEscalationCount: 0,
    ok: false,
    openPlanCount: 0,
    recentPlans: [],
    todayAllocatedHours: 0,
    todayScheduleCount: 0,
    totalLeafItemCount: 0,
    clientsList: [],
    staffList: [],
    todaySchedulesList: [],
    dueItemsList: [],
    attentionItemsList: [],
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateStartUtc(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isDueByRecurrence(
  item: z.infer<typeof LeafItemRowSchema>,
  lastCleanedAt: string | null,
  todayStart: number,
) {
  if (item.tag !== "normal" || item.recurrence_days === null) return false;
  if (!lastCleanedAt) return true;
  const lastCleanedStart = dateStartUtc(lastCleanedAt);
  if (lastCleanedStart === null) return true;
  return Math.floor((todayStart - lastCleanedStart) / DAY_MS) >= item.recurrence_days;
}

function countValue(value: number | null) {
  return value ?? 0;
}

const sanitizeName = (name: string) => (name === "Sarah Koch" ? "Stefan Schmidt" : name);

export async function getAdminHomeData(locale: Locale): Promise<AdminHomeData> {
  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const today = todayIsoDate();
    const todayStart = dateStartUtc(`${today}T00:00:00.000Z`) ?? Date.now();

    const [
      activeClientsResult,
      employeesResult,
      activeAssignmentsResult,
      leafItemsResult,
      todayScheduleResult,
      openPlansResult,
      mandatoryStepsResult,
      recentPlansResult,
      allClientsResult,
      allProfilesResult,
    ] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employee"),
      supabase
        .from("employee_client_assignments")
        .select("id", { count: "exact", head: true })
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`),
      supabase.from("leaf_items").select("id, name, recurrence_days, estimated_minutes, tag"),
      supabase
        .from("work_schedule")
        .select("id, employee_id, client_id, allocated_hours, work_date")
        .eq("work_date", today),
      supabase.from("daily_plans").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase
        .from("mandatory_cleaning_tool_step_status")
        .select("cleaning_tool_step_id", { count: "exact", head: true })
        .eq("is_overdue", true),
      supabase
        .from("daily_plans")
        .select("id, employee_id, client_id, work_date, status, submitted_at")
        .order("work_date", { ascending: false })
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase.from("clients").select("id, name, address, contact_info, is_active").order("name"),
      supabase.from("profiles").select("id, full_name, role, default_daily_hours").order("full_name"),
    ]);

    if (
      activeClientsResult.error ||
      employeesResult.error ||
      activeAssignmentsResult.error ||
      leafItemsResult.error ||
      todayScheduleResult.error ||
      openPlansResult.error ||
      mandatoryStepsResult.error ||
      recentPlansResult.error ||
      allClientsResult.error ||
      allProfilesResult.error
    ) {
      return initialData();
    }

    const leafItems = z.array(LeafItemRowSchema).safeParse(leafItemsResult.data);
    const todaySchedules = z.array(ScheduleRowSchema).safeParse(todayScheduleResult.data);
    const recentPlans = z.array(RecentPlanRowSchema).safeParse(recentPlansResult.data);
    const clients = z.array(ClientRowSchema).safeParse(allClientsResult.data);
    const profiles = z.array(ProfileRowSchema).safeParse(allProfilesResult.data);

    if (!leafItems.success || !todaySchedules.success || !recentPlans.success || !clients.success || !profiles.success) {
      return initialData();
    }

    const clientMap = new Map(clients.data.map((c) => [c.id, c.name]));
    const profileMap = new Map(profiles.data.map((p) => [p.id, sanitizeName(p.full_name)]));

    const leafItemIds = leafItems.data.map((item) => item.id);
    const lastCleanedResult =
      leafItemIds.length > 0
        ? await supabase
            .from("leaf_item_last_cleaned")
            .select("leaf_item_id, last_cleaned_at")
            .in("leaf_item_id", leafItemIds)
        : { data: [], error: null };

    if (lastCleanedResult.error) return initialData();

    const lastCleanedRows = z.array(LastCleanedRowSchema).safeParse(lastCleanedResult.data);
    if (!lastCleanedRows.success) return initialData();

    const planIds = recentPlans.data.map((plan) => plan.id);
    const planItemsResult = planIds.length > 0
      ? await supabase.from("daily_plan_items").select("daily_plan_id, is_completed").in("daily_plan_id", planIds)
      : { data: [], error: null };

    if (planItemsResult.error) return initialData();

    const planItems = z.array(DailyPlanItemRowSchema).safeParse(planItemsResult.data);
    if (!planItems.success) return initialData();

    const lastCleaned = new Map(lastCleanedRows.data.map((row) => [row.leaf_item_id, row.last_cleaned_at]));
    const highPriorityItemCount = leafItems.data.filter((item) => item.tag === "high_priority").length;
    const complaintItemCount = leafItems.data.filter((item) => item.tag === "complaint").length;

    const dueItemsList = leafItems.data
      .filter((item) => isDueByRecurrence(item, lastCleaned.get(item.id) ?? null, todayStart))
      .map((item) => ({
        id: item.id,
        name: item.name,
        tag: item.tag,
        estimatedMinutes: item.estimated_minutes,
      }));

    const attentionItemsList = leafItems.data
      .filter((item) => item.tag === "high_priority" || item.tag === "complaint")
      .map((item) => ({
        id: item.id,
        name: item.name,
        tag: item.tag,
        estimatedMinutes: item.estimated_minutes,
      }));

    const clientsList: DetailClientItem[] = clients.data.map((c) => {
      const info = c.contact_info as { phone?: string; email?: string } | null;
      return {
        id: c.id,
        name: c.name,
        address: c.address || "Deutschland",
        phone: info?.phone || "+49 89 000000",
        email: info?.email || "kontakt@demo.de",
        isActive: c.is_active,
      };
    });

    const staffList: DetailStaffItem[] = profiles.data
      .filter((p) => p.role === "employee")
      .map((p) => ({
        id: p.id,
        fullName: sanitizeName(p.full_name),
        role: p.role,
        defaultDailyHours: p.default_daily_hours || 8.0,
      }));

    const todaySchedulesList: DetailScheduleItem[] = todaySchedules.data.map((s) => ({
      id: s.id,
      employeeName: profileMap.get(s.employee_id) ?? "Mitarbeiter",
      clientName: clientMap.get(s.client_id) ?? "Kunde",
      allocatedHours: s.allocated_hours,
      workDate: s.work_date,
    }));

    const itemsByPlan = new Map<string, { completed: number; total: number }>();
    planItems.data.forEach((item) => {
      const current = itemsByPlan.get(item.daily_plan_id) ?? { completed: 0, total: 0 };
      current.total += 1;
      if (item.is_completed) current.completed += 1;
      itemsByPlan.set(item.daily_plan_id, current);
    });

    const recentPlansList: RecentAdminPlan[] = recentPlans.data.map((plan) => {
      const counts = itemsByPlan.get(plan.id) ?? { completed: 0, total: 0 };
      return {
        clientName: clientMap.get(plan.client_id) ?? "",
        completedItems: counts.completed,
        employeeName: profileMap.get(plan.employee_id) ?? "",
        id: plan.id,
        status: plan.status,
        submittedAt: plan.submitted_at,
        totalItems: counts.total,
        workDate: plan.work_date,
      };
    });

    return {
      activeAssignmentCount: countValue(activeAssignmentsResult.count),
      activeClientCount: countValue(activeClientsResult.count),
      attentionItemCount: highPriorityItemCount + complaintItemCount,
      complaintItemCount,
      dueItemCount: dueItemsList.length,
      employeeCount: countValue(employeesResult.count),
      highPriorityItemCount,
      mandatoryStepEscalationCount: countValue(mandatoryStepsResult.count),
      ok: true,
      openPlanCount: countValue(openPlansResult.count),
      recentPlans: recentPlansList,
      todayAllocatedHours: Math.round(todaySchedules.data.reduce((t, s) => t + s.allocated_hours, 0) * 100) / 100,
      todayScheduleCount: todaySchedules.data.length,
      totalLeafItemCount: leafItems.data.length,
      clientsList,
      staffList,
      todaySchedulesList,
      dueItemsList,
      attentionItemsList,
    };
  } catch {
    return initialData();
  }
}
