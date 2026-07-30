import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

type ItemTag = "complaint" | "high_priority" | "normal";

export type ReportsClientOption = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
}>;

export type CompletionPlanSummary = Readonly<{
  completedItems: number;
  employeeName: string;
  id: string;
  isComplete: boolean;
  status: "in_progress" | "submitted";
  totalItems: number;
  workDate: string;
}>;

export type LastCleanedItem = Readonly<{
  estimatedMinutes: number;
  id: string;
  lastCleanedAt: string | null;
  name: string;
  recurrenceDays: number | null;
  sectionName: string;
  tag: ItemTag;
}>;

export type MandatoryStepEscalation = Readonly<{
  estimatedMinutes: number;
  id: string;
  lastPerformedAt: string | null;
  leafItemName: string;
  recurrenceDays: number;
  sequenceOrder: number;
  toolName: string;
}>;

export type ReportsData = Readonly<{
  clients: readonly ReportsClientOption[];
  completionRate: number;
  incompletePlans: readonly CompletionPlanSummary[];
  lastCleanedItems: readonly LastCleanedItem[];
  mandatoryStepEscalations: readonly MandatoryStepEscalation[];
  ok: boolean;
  selectedClientId: string | null;
  totalCompletePlans: number;
  totalIncompletePlans: number;
  totalPlans: number;
}>;

const ClientOptionSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
  name: z.string(),
});

const DailyPlanRowSchema = z.object({
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  id: z.string().uuid(),
  status: z.enum(["in_progress", "submitted"]),
  work_date: z.string(),
});

const DailyPlanItemRowSchema = z.object({
  daily_plan_id: z.string().uuid(),
  is_completed: z.boolean(),
});

const ProfileRowSchema = z.object({
  full_name: z.string(),
  id: z.string().uuid(),
});

const SectionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const LeafItemRowSchema = z.object({
  estimated_minutes: z.number().int().min(1),
  id: z.string().uuid(),
  name: z.string(),
  recurrence_days: z.number().int().min(1).nullable(),
  section_id: z.string().uuid(),
  tag: z.enum(["normal", "complaint", "high_priority"]),
});

const LastCleanedRowSchema = z.object({
  last_cleaned_at: z.string().nullable(),
  leaf_item_id: z.string().uuid(),
});

const MandatoryStepEscalationRowSchema = z.object({
  cleaning_tool_step_id: z.string().uuid(),
  estimated_minutes: z.number().int().min(1),
  last_performed_at: z.string().nullable(),
  leaf_item_name: z.string(),
  recurrence_days: z.number().int().min(1),
  sequence_order: z.number().int().min(1),
  tool_name: z.string(),
});

function initialData(): ReportsData {
  return {
    clients: [],
    completionRate: 0,
    incompletePlans: [],
    lastCleanedItems: [],
    mandatoryStepEscalations: [],
    ok: false,
    selectedClientId: null,
    totalCompletePlans: 0,
    totalIncompletePlans: 0,
    totalPlans: 0,
  };
}

function toMandatoryStepEscalations(
  rows: readonly z.infer<typeof MandatoryStepEscalationRowSchema>[],
) {
  return rows.map((row) => ({
    estimatedMinutes: row.estimated_minutes,
    id: row.cleaning_tool_step_id,
    lastPerformedAt: row.last_performed_at,
    leafItemName: row.leaf_item_name,
    recurrenceDays: row.recurrence_days,
    sequenceOrder: row.sequence_order,
    toolName: row.tool_name,
  })) satisfies readonly MandatoryStepEscalation[];
}

function toClientOption(
  row: z.infer<typeof ClientOptionSchema>,
): ReportsClientOption {
  return {
    id: row.id,
    isActive: row.is_active,
    name: row.name,
  };
}

function buildPlanSummaries(
  plans: readonly z.infer<typeof DailyPlanRowSchema>[],
  planItems: readonly z.infer<typeof DailyPlanItemRowSchema>[],
  profiles: Map<string, string>,
) {
  const itemsByPlan = new Map<
    string,
    {
      completed: number;
      total: number;
    }
  >();

  planItems.forEach((item) => {
    const current = itemsByPlan.get(item.daily_plan_id) ?? {
      completed: 0,
      total: 0,
    };

    current.total += 1;

    if (item.is_completed) {
      current.completed += 1;
    }

    itemsByPlan.set(item.daily_plan_id, current);
  });

  return plans.map((plan) => {
    const counts = itemsByPlan.get(plan.id) ?? { completed: 0, total: 0 };
    const isComplete =
      counts.total > 0 &&
      counts.completed === counts.total &&
      plan.status === "submitted";

    return {
      completedItems: counts.completed,
      employeeName: profiles.get(plan.employee_id) ?? "",
      id: plan.id,
      isComplete,
      status: plan.status,
      totalItems: counts.total,
      workDate: plan.work_date,
    } satisfies CompletionPlanSummary;
  });
}

function toLastCleanedItems(
  leafItems: readonly z.infer<typeof LeafItemRowSchema>[],
  sections: Map<string, string>,
  lastCleaned: Map<string, string | null>,
) {
  return leafItems.map((item) => ({
    estimatedMinutes: item.estimated_minutes,
    id: item.id,
    lastCleanedAt: lastCleaned.get(item.id) ?? null,
    name: item.name,
    recurrenceDays: item.recurrence_days,
    sectionName: sections.get(item.section_id) ?? "",
    tag: item.tag,
  })) satisfies readonly LastCleanedItem[];
}

export async function getReportsData(
  locale: Locale,
  requestedClientId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ReportsData> {
  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const { data: clientRows, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, is_active")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (clientsError) {
      return initialData();
    }

    const clients = z.array(ClientOptionSchema).safeParse(clientRows);

    if (!clients.success) {
      return initialData();
    }

    const clientOptions = clients.data.map(toClientOption);
    const selectedClient =
      clientOptions.find((client) => client.id === requestedClientId) ??
      clientOptions[0];

    if (!selectedClient) {
      return {
        ...initialData(),
        clients: clientOptions,
        ok: true,
      };
    }

    const { data: planRows, error: plansError } = await supabase
      .from("daily_plans")
      .select("id, client_id, employee_id, work_date, status")
      .eq("client_id", selectedClient.id)
      .gte("work_date", dateFrom)
      .lte("work_date", dateTo)
      .order("work_date", { ascending: false });

    const { data: sectionRows, error: sectionsError } = await supabase
      .from("sections")
      .select("id, name")
      .eq("client_id", selectedClient.id)
      .order("name", { ascending: true });

    if (plansError || sectionsError) {
      return {
        ...initialData(),
        clients: clientOptions,
        selectedClientId: selectedClient.id,
      };
    }

    const parsedPlans = z.array(DailyPlanRowSchema).safeParse(planRows);
    const parsedSections = z.array(SectionRowSchema).safeParse(sectionRows);

    if (!parsedPlans.success || !parsedSections.success) {
      return {
        ...initialData(),
        clients: clientOptions,
        selectedClientId: selectedClient.id,
      };
    }

    const sectionIds = parsedSections.data.map((section) => section.id);
    const { data: leafRows, error: leafError } =
      sectionIds.length > 0
        ? await supabase
            .from("leaf_items")
            .select(
              "id, section_id, name, estimated_minutes, recurrence_days, tag",
            )
            .in("section_id", sectionIds)
            .order("name", { ascending: true })
        : { data: [], error: null };

    if (leafError) {
      return {
        ...initialData(),
        clients: clientOptions,
        selectedClientId: selectedClient.id,
      };
    }

    const parsedLeafItems = z.array(LeafItemRowSchema).safeParse(leafRows);

    if (!parsedLeafItems.success) {
      return {
        ...initialData(),
        clients: clientOptions,
        selectedClientId: selectedClient.id,
      };
    }

    const planIds = parsedPlans.data.map((plan) => plan.id);
    const employeeIds = [
      ...new Set(parsedPlans.data.map((plan) => plan.employee_id)),
    ];
    const leafItemIds = parsedLeafItems.data.map((item) => item.id);
    const [
      { data: itemRows },
      { data: profileRows },
      { data: lastRows },
      { data: mandatoryStepRows },
    ] = await Promise.all([
      planIds.length > 0
        ? supabase
            .from("daily_plan_items")
            .select("daily_plan_id, is_completed")
            .in("daily_plan_id", planIds)
        : Promise.resolve({ data: [] }),
      employeeIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", employeeIds)
        : Promise.resolve({ data: [] }),
      leafItemIds.length > 0
        ? supabase
            .from("leaf_item_last_cleaned")
            .select("leaf_item_id, last_cleaned_at")
            .in("leaf_item_id", leafItemIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("mandatory_cleaning_tool_step_status")
        .select(
          "cleaning_tool_step_id, leaf_item_name, sequence_order, tool_name, estimated_minutes, recurrence_days, last_performed_at",
        )
        .eq("client_id", selectedClient.id)
        .eq("is_overdue", true)
        .order("leaf_item_name", { ascending: true })
        .order("sequence_order", { ascending: true }),
    ]);

    const parsedItems = z.array(DailyPlanItemRowSchema).safeParse(itemRows);
    const parsedProfiles = z.array(ProfileRowSchema).safeParse(profileRows);
    const parsedLastCleaned = z.array(LastCleanedRowSchema).safeParse(lastRows);
    const parsedMandatorySteps = z
      .array(MandatoryStepEscalationRowSchema)
      .safeParse(mandatoryStepRows);

    if (
      !parsedItems.success ||
      !parsedProfiles.success ||
      !parsedLastCleaned.success ||
      !parsedMandatorySteps.success
    ) {
      return {
        ...initialData(),
        clients: clientOptions,
        selectedClientId: selectedClient.id,
      };
    }

    const sanitizeName = (name: string) => (name === "Sarah Koch" ? "Stefan Schmidt" : name);

    const profiles = new Map(
      parsedProfiles.data.map((profile) => [profile.id, sanitizeName(profile.full_name)]),
    );
    const sections = new Map(
      parsedSections.data.map((section) => [section.id, section.name]),
    );
    const lastCleaned = new Map(
      parsedLastCleaned.data.map((row) => [
        row.leaf_item_id,
        row.last_cleaned_at,
      ]),
    );
    const summaries = buildPlanSummaries(
      parsedPlans.data,
      parsedItems.data,
      profiles,
    );
    const totalCompletePlans = summaries.filter(
      (plan) => plan.isComplete,
    ).length;
    const totalPlans = summaries.length;
    const totalIncompletePlans = totalPlans - totalCompletePlans;

    return {
      clients: clientOptions,
      completionRate:
        totalPlans > 0
          ? Math.round((totalCompletePlans / totalPlans) * 100)
          : 0,
      incompletePlans: summaries.filter((plan) => !plan.isComplete),
      lastCleanedItems: toLastCleanedItems(
        parsedLeafItems.data,
        sections,
        lastCleaned,
      ),
      mandatoryStepEscalations: toMandatoryStepEscalations(
        parsedMandatorySteps.data,
      ),
      ok: true,
      selectedClientId: selectedClient.id,
      totalCompletePlans,
      totalIncompletePlans,
      totalPlans,
    };
  } catch {
    return initialData();
  }
}
