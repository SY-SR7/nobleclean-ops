import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type EmployeeWeeklyAvailabilityDay = Readonly<{
  weekday: number;
  isAvailable: boolean;
}>;

export type EmployeeAssignmentHistoryItem = Readonly<{
  id: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}>;

export type EmployeeRecentPlanItem = Readonly<{
  id: string;
  clientId: string;
  clientName: string;
  workDate: string;
  status: "in_progress" | "submitted";
  submittedAt: string | null;
  totalItems: number;
  completedItems: number;
}>;

export type EmployeeDetailData = Readonly<{
  ok: boolean;
  employee: Readonly<{
    id: string;
    fullName: string;
    role: "admin" | "employee";
    defaultDailyHours: number | null;
    avatarPath: string | null;
  }> | null;
  weeklyAvailability: readonly EmployeeWeeklyAvailabilityDay[];
  assignmentHistory: readonly EmployeeAssignmentHistoryItem[];
  recentPlans: readonly EmployeeRecentPlanItem[];
}>;

const ProfileRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  role: z.enum(["admin", "employee"]),
  default_daily_hours: z.number().nullable().optional(),
  avatar_path: z.string().nullable().optional(),
});

const AvailabilityRowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  is_available: z.boolean(),
});

const AssignmentRowSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
});

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const PlanRowSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  work_date: z.string(),
  status: z.enum(["in_progress", "submitted"]),
  submitted_at: z.string().nullable().optional(),
});

const PlanItemRowSchema = z.object({
  daily_plan_id: z.string().uuid(),
  is_completed: z.boolean(),
});

function isActiveAssignment(startDate: string, endDate: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return startDate <= today && (!endDate || endDate >= today);
}

function emptyData(): EmployeeDetailData {
  return {
    assignmentHistory: [],
    employee: null,
    ok: false,
    recentPlans: [],
    weeklyAvailability: [],
  };
}

function fullWeekTemplate(
  rows: readonly { weekday: number; is_available: boolean }[],
): readonly EmployeeWeeklyAvailabilityDay[] {
  const byWeekday = new Map(rows.map((row) => [row.weekday, row.is_available]));
  return Array.from({ length: 7 }, (_, weekday) => ({
    isAvailable: byWeekday.get(weekday) ?? true,
    weekday,
  }));
}

export async function getEmployeeDetailData(
  locale: Locale,
  employeeId: string,
): Promise<EmployeeDetailData> {
  await requireRole(locale, "admin");

  const parsedId = z.string().uuid().safeParse(employeeId);

  if (!parsedId.success) {
    return emptyData();
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, default_daily_hours, avatar_path")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (profileError || !profileRow) {
      return emptyData();
    }

    const profile = ProfileRowSchema.safeParse(profileRow);

    if (!profile.success) {
      return emptyData();
    }

    const [
      { data: availabilityRows, error: availabilityError },
      { data: assignmentRows, error: assignmentError },
      { data: planRows, error: planError },
    ] = await Promise.all([
      supabase
        .from("employee_weekly_availability")
        .select("weekday, is_available")
        .eq("employee_id", parsedId.data),
      supabase
        .from("employee_client_assignments")
        .select("id, client_id, start_date, end_date")
        .eq("employee_id", parsedId.data)
        .order("start_date", { ascending: false }),
      supabase
        .from("daily_plans")
        .select("id, client_id, work_date, status, submitted_at")
        .eq("employee_id", parsedId.data)
        .order("work_date", { ascending: false })
        .limit(20),
    ]);

    if (availabilityError || assignmentError || planError) {
      return emptyData();
    }

    const availability = z
      .array(AvailabilityRowSchema)
      .safeParse(availabilityRows);
    const assignments = z.array(AssignmentRowSchema).safeParse(assignmentRows);
    const plans = z.array(PlanRowSchema).safeParse(planRows);

    if (!availability.success || !assignments.success || !plans.success) {
      return emptyData();
    }

    const clientIds = Array.from(
      new Set([
        ...assignments.data.map((row) => row.client_id),
        ...plans.data.map((row) => row.client_id),
      ]),
    );

    const { data: clientRows, error: clientError } = clientIds.length
      ? await supabase.from("clients").select("id, name").in("id", clientIds)
      : { data: [], error: null };

    if (clientError) {
      return emptyData();
    }

    const clients = z.array(ClientRowSchema).safeParse(clientRows ?? []);

    if (!clients.success) {
      return emptyData();
    }

    const clientMap = new Map(
      clients.data.map((client) => [client.id, client.name]),
    );

    const planIds = plans.data.map((row) => row.id);
    const { data: planItemRows, error: planItemError } = planIds.length
      ? await supabase
          .from("daily_plan_items")
          .select("daily_plan_id, is_completed")
          .in("daily_plan_id", planIds)
      : { data: [], error: null };

    if (planItemError) {
      return emptyData();
    }

    const planItems = z.array(PlanItemRowSchema).safeParse(planItemRows ?? []);

    if (!planItems.success) {
      return emptyData();
    }

    const itemCountsByPlan = new Map<
      string,
      { total: number; completed: number }
    >();
    planItems.data.forEach((item) => {
      const existing = itemCountsByPlan.get(item.daily_plan_id) ?? {
        completed: 0,
        total: 0,
      };
      existing.total += 1;
      if (item.is_completed) existing.completed += 1;
      itemCountsByPlan.set(item.daily_plan_id, existing);
    });

    return {
      assignmentHistory: assignments.data.map((row) => ({
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) ?? "",
        endDate: row.end_date,
        id: row.id,
        isActive: isActiveAssignment(row.start_date, row.end_date),
        startDate: row.start_date,
      })),
      employee: {
        avatarPath: profile.data.avatar_path,
        defaultDailyHours: profile.data.default_daily_hours,
        fullName: profile.data.full_name,
        id: profile.data.id,
        role: profile.data.role,
      },
      ok: true,
      recentPlans: plans.data.map((row) => {
        const counts = itemCountsByPlan.get(row.id) ?? {
          completed: 0,
          total: 0,
        };
        return {
          clientId: row.client_id,
          clientName: clientMap.get(row.client_id) ?? "",
          completedItems: counts.completed,
          id: row.id,
          status: row.status,
          submittedAt: row.submitted_at,
          totalItems: counts.total,
          workDate: row.work_date,
        };
      }),
      weeklyAvailability: fullWeekTemplate(availability.data),
    };
  } catch {
    return emptyData();
  }
}
