import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type MyDayAdvisoryStatus = "critical" | "recent" | "warning" | null;

export type MyDayItem = Readonly<{
  advisoryStatus: MyDayAdvisoryStatus;
  estimatedMinutes: number;
  id: string;
  isCompleted: boolean;
  isSelected: boolean;
  lastCleanedAt: string | null;
  name: string;
  quantity: number;
  recurrenceDays: number | null;
  referenceImagePath: string | null;
  sectionPath: string;
  tag: "complaint" | "high_priority" | "normal";
}>;

export type MyDayPlan = Readonly<{
  completedItems: number;
  id: string;
  plannedMinutes: number;
  selectedItems: number;
  status: "in_progress" | "submitted";
  submittedAt: string | null;
}>;

export type MyDaySchedule = Readonly<{
  allocatedHours: number;
  allocatedMinutes: number;
  clientId: string;
  clientName: string;
  id: string;
  workDate: string;
}>;

export type MyDayData = Readonly<{
  items: readonly MyDayItem[];
  ok: boolean;
  plan: MyDayPlan | null;
  schedule: MyDaySchedule | null;
}>;

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });

const HoursSchema = z.preprocess(
  (value) => (typeof value === "string" ? Number(value) : value),
  z.number().min(0.25).max(24),
);

const WorkScheduleRowSchema = z.object({
  allocated_hours: HoursSchema,
  client_id: z.string().uuid(),
  id: z.string().uuid(),
  work_date: IsoDateSchema,
});

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const SectionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parent_section_id: z.string().uuid().nullable(),
});

const AssignedItemStatusRowSchema = z.object({
  estimated_minutes: z.number().int().min(1),
  last_cleaned_at: z.string().nullable(),
  leaf_item_id: z.string().uuid(),
  name: z.string(),
  quantity: z.number().int().min(1),
  recurrence_days: z.number().int().min(1).nullable(),
  reference_image_path: z.string().nullable(),
  section_id: z.string().uuid(),
  tag: z.enum(["normal", "complaint", "high_priority"]),
});

const DailyPlanRowSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["in_progress", "submitted"]),
  submitted_at: z.string().nullable(),
});

const DailyPlanItemRowSchema = z.object({
  is_completed: z.boolean(),
  leaf_item_id: z.string().uuid(),
});

function emptyData(ok = false): MyDayData {
  return {
    items: [],
    ok,
    plan: null,
    schedule: null,
  };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function safeWorkDate(value: string): string {
  return IsoDateSchema.safeParse(value).success ? value : todayIsoDate();
}

function daysBetween(from: string, to: string): number | null {
  const fromDate = new Date(from);
  const toDate = new Date(`${to}T00:00:00.000Z`);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null;
  }

  return Math.floor(
    (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function advisoryStatus(
  row: z.infer<typeof AssignedItemStatusRowSchema>,
  workDate: string,
): MyDayAdvisoryStatus {
  if (row.tag === "high_priority") {
    return "critical";
  }

  if (row.tag === "complaint") {
    return "warning";
  }

  if (!row.recurrence_days || !row.last_cleaned_at) {
    return null;
  }

  const elapsedDays = daysBetween(row.last_cleaned_at, workDate);
  return elapsedDays !== null &&
    elapsedDays >= 0 &&
    elapsedDays < row.recurrence_days
    ? "recent"
    : null;
}

function buildSectionPaths(
  rows: readonly z.infer<typeof SectionRowSchema>[],
): Map<string, string> {
  const byId = new Map(rows.map((section) => [section.id, section]));
  const paths = new Map<string, string>();

  function pathFor(sectionId: string, seen = new Set<string>()): string {
    const cached = paths.get(sectionId);

    if (cached) {
      return cached;
    }

    const section = byId.get(sectionId);

    if (!section || seen.has(sectionId)) {
      return "";
    }

    seen.add(sectionId);
    const parentPath = section.parent_section_id
      ? pathFor(section.parent_section_id, seen)
      : "";
    const path = parentPath ? `${parentPath} / ${section.name}` : section.name;
    paths.set(sectionId, path);
    return path;
  }

  rows.forEach((section) => {
    pathFor(section.id);
  });

  return paths;
}

function toSchedule(
  schedule: z.infer<typeof WorkScheduleRowSchema>,
  client: z.infer<typeof ClientRowSchema>,
): MyDaySchedule {
  return {
    allocatedHours: schedule.allocated_hours,
    allocatedMinutes: Math.round(schedule.allocated_hours * 60),
    clientId: client.id,
    clientName: client.name,
    id: schedule.id,
    workDate: schedule.work_date,
  };
}

export async function getMyDayData(
  locale: Locale,
  workDate: string,
): Promise<MyDayData> {
  const session = await requireRole(locale, "employee");

  try {
    const supabase = await createSupabaseServerClient();
    const { data: scheduleRow, error: scheduleError } = await supabase
      .from("work_schedule")
      .select("id, client_id, work_date, allocated_hours")
      .eq("employee_id", session.profile.id)
      .eq("work_date", workDate)
      .maybeSingle();

    if (scheduleError) {
      return emptyData();
    }

    const parsedSchedule = WorkScheduleRowSchema.safeParse(scheduleRow);

    if (!parsedSchedule.success) {
      return emptyData(true);
    }

    const [clientResult, sectionResult, itemResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("id", parsedSchedule.data.client_id)
        .maybeSingle(),
      supabase
        .from("sections")
        .select("id, parent_section_id, name")
        .eq("client_id", parsedSchedule.data.client_id)
        .order("name", { ascending: true }),
      supabase.rpc("get_assigned_client_leaf_item_status", {
        target_client_id: parsedSchedule.data.client_id,
      }),
    ]);

    const clientRow: unknown = clientResult.data;
    const sectionRows: unknown = sectionResult.data;
    const itemRows: unknown = itemResult.data;
    const parsedClient = ClientRowSchema.safeParse(clientRow);
    const parsedSections = z.array(SectionRowSchema).safeParse(sectionRows);
    const parsedItems = z
      .array(AssignedItemStatusRowSchema)
      .safeParse(itemRows);

    if (
      !parsedClient.success ||
      !parsedSections.success ||
      !parsedItems.success
    ) {
      return emptyData();
    }

    const { data: planRow } = await supabase
      .from("daily_plans")
      .select("id, status, submitted_at")
      .eq("employee_id", session.profile.id)
      .eq("client_id", parsedSchedule.data.client_id)
      .eq("work_date", workDate)
      .maybeSingle();
    const parsedPlan = DailyPlanRowSchema.safeParse(planRow);
    const { data: planItemRows } = parsedPlan.success
      ? await supabase
          .from("daily_plan_items")
          .select("leaf_item_id, is_completed")
          .eq("daily_plan_id", parsedPlan.data.id)
      : { data: [] };
    const parsedPlanItems = z
      .array(DailyPlanItemRowSchema)
      .safeParse(planItemRows);
    const selectedItems = new Map(
      parsedPlanItems.success
        ? parsedPlanItems.data.map((item) => [item.leaf_item_id, item])
        : [],
    );
    const sectionPaths = buildSectionPaths(parsedSections.data);
    const items = parsedItems.data
      .map((item) => {
        const planItem = selectedItems.get(item.leaf_item_id);

        return {
          advisoryStatus: advisoryStatus(item, workDate),
          estimatedMinutes: item.estimated_minutes,
          id: item.leaf_item_id,
          isCompleted: planItem?.is_completed ?? false,
          isSelected: Boolean(planItem),
          lastCleanedAt: item.last_cleaned_at,
          name: item.name,
          quantity: item.quantity,
          recurrenceDays: item.recurrence_days,
          referenceImagePath: item.reference_image_path,
          sectionPath: sectionPaths.get(item.section_id) ?? "",
          tag: item.tag,
        } satisfies MyDayItem;
      })
      .sort(
        (a, b) =>
          a.sectionPath.localeCompare(b.sectionPath) ||
          a.name.localeCompare(b.name),
      );
    const plannedMinutes = items
      .filter((item) => item.isSelected)
      .reduce((total, item) => total + item.estimatedMinutes, 0);

    return {
      items,
      ok: true,
      plan: parsedPlan.success
        ? {
            completedItems: items.filter((item) => item.isCompleted).length,
            id: parsedPlan.data.id,
            plannedMinutes,
            selectedItems: selectedItems.size,
            status: parsedPlan.data.status,
            submittedAt: parsedPlan.data.submitted_at,
          }
        : null,
      schedule: toSchedule(parsedSchedule.data, parsedClient.data),
    };
  } catch {
    return emptyData();
  }
}
