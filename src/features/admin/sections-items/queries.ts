import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

import type { ItemTag } from "./schema";

export type SectionClientOption = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
}>;

export type SectionOption = Readonly<{
  depth: number;
  id: string;
  name: string;
}>;

export type SectionTreeNode = Readonly<{
  clientId: string;
  depth: number;
  hasReferenceImage: boolean;
  id: string;
  leafCount: number;
  name: string;
  parentSectionId: string | null;
  sortOrder: number;
  totalEstimatedMinutes: number;
}>;

export type LeafItemListItem = Readonly<{
  estimatedMinutes: number;
  hasReferenceImage: boolean;
  id: string;
  name: string;
  notes: string | null;
  quantity: number;
  recurrenceDays: number | null;
  sectionId: string;
  stepEstimateMinutes: number;
  tag: ItemTag;
  toolSteps: readonly CleaningToolStepListItem[];
}>;

export type CleaningToolStepListItem = Readonly<{
  estimatedMinutes: number;
  id: string;
  isMandatory: boolean;
  leafItemId: string;
  lastPerformedAt: string | null;
  notes: string | null;
  recurrenceDays: number;
  sequenceOrder: number;
  toolName: string;
}>;

export type SectionsItemsData = Readonly<{
  clients: readonly SectionClientOption[];
  leafItems: readonly LeafItemListItem[];
  ok: boolean;
  selectedClientId: string | null;
  selectedSectionId: string | null;
  sectionOptions: readonly SectionOption[];
  sections: readonly SectionTreeNode[];
}>;

const ClientOptionSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
  name: z.string(),
});

const SectionRowSchema = z.object({
  client_id: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string(),
  parent_section_id: z.string().uuid().nullable(),
  reference_image_path: z.string().nullable(),
  sort_order: z.number().int().min(0),
});

const SectionTotalRowSchema = z.object({
  descendant_leaf_count: z.number().int().min(0),
  section_id: z.string().uuid(),
  total_estimated_minutes: z.number().int().min(0),
});

const LeafItemRowSchema = z.object({
  estimated_minutes: z.number().int().min(1),
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  quantity: z.number().int().min(1),
  recurrence_days: z.number().int().min(1).nullable(),
  reference_image_path: z.string().nullable(),
  section_id: z.string().uuid(),
  tag: z.enum(["normal", "complaint", "high_priority"]),
});

const CleaningToolStepRowSchema = z.object({
  estimated_minutes: z.number().int().min(1),
  id: z.string().uuid(),
  is_mandatory: z.boolean(),
  leaf_item_id: z.string().uuid(),
  notes: z.string().nullable(),
  recurrence_days: z.number().int().min(1),
  sequence_order: z.number().int().min(1),
  tool_name: z.string(),
});

const CleaningToolStepLastPerformedRowSchema = z.object({
  cleaning_tool_step_id: z.string().uuid(),
  last_performed_at: z.string().nullable(),
});

function toClientOption(
  row: z.infer<typeof ClientOptionSchema>,
): SectionClientOption {
  return {
    id: row.id,
    isActive: row.is_active,
    name: row.name,
  };
}

function flattenSections(
  rows: readonly z.infer<typeof SectionRowSchema>[],
  totals: Map<string, z.infer<typeof SectionTotalRowSchema>>,
) {
  const byParent = new Map<string, z.infer<typeof SectionRowSchema>[]>();

  rows.forEach((row) => {
    const parentKey = row.parent_section_id ?? "root";
    byParent.set(parentKey, [...(byParent.get(parentKey) ?? []), row]);
  });

  byParent.forEach((children) => {
    children.sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    );
  });

  const flattened: SectionTreeNode[] = [];

  function walk(parentId: string, depth: number) {
    const children = byParent.get(parentId) ?? [];

    children.forEach((row) => {
      const total = totals.get(row.id);

      flattened.push({
        clientId: row.client_id,
        depth,
        hasReferenceImage: Boolean(row.reference_image_path),
        id: row.id,
        leafCount: total?.descendant_leaf_count ?? 0,
        name: row.name,
        parentSectionId: row.parent_section_id,
        sortOrder: row.sort_order,
        totalEstimatedMinutes: total?.total_estimated_minutes ?? 0,
      });

      walk(row.id, depth + 1);
    });
  }

  walk("root", 0);
  return flattened;
}

function toSectionOptions(
  sections: readonly SectionTreeNode[],
): readonly SectionOption[] {
  return sections.map((section) => ({
    depth: section.depth,
    id: section.id,
    name: section.name,
  }));
}

function toCleaningToolStep(
  row: z.infer<typeof CleaningToolStepRowSchema>,
  lastPerformed: Map<string, string | null>,
): CleaningToolStepListItem {
  return {
    estimatedMinutes: row.estimated_minutes,
    id: row.id,
    isMandatory: row.is_mandatory,
    lastPerformedAt: lastPerformed.get(row.id) ?? null,
    leafItemId: row.leaf_item_id,
    notes: row.notes,
    recurrenceDays: row.recurrence_days,
    sequenceOrder: row.sequence_order,
    toolName: row.tool_name,
  };
}

function toLeafItem(
  row: z.infer<typeof LeafItemRowSchema>,
  toolSteps: readonly CleaningToolStepListItem[],
): LeafItemListItem {
  return {
    estimatedMinutes: row.estimated_minutes,
    hasReferenceImage: Boolean(row.reference_image_path),
    id: row.id,
    name: row.name,
    notes: row.notes,
    quantity: row.quantity,
    recurrenceDays: row.recurrence_days,
    sectionId: row.section_id,
    stepEstimateMinutes: toolSteps.reduce(
      (total, step) => total + step.estimatedMinutes,
      0,
    ),
    tag: row.tag,
    toolSteps,
  };
}

function initialData(): SectionsItemsData {
  return {
    clients: [],
    leafItems: [],
    ok: false,
    selectedClientId: null,
    selectedSectionId: null,
    sectionOptions: [],
    sections: [],
  };
}

export async function getSectionsItemsData(
  locale: Locale,
  requestedClientId: string,
  requestedSectionId: string,
): Promise<SectionsItemsData> {
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

    const { data: sectionRows, error: sectionsError } = await supabase
      .from("sections")
      .select(
        "id, client_id, parent_section_id, name, sort_order, reference_image_path",
      )
      .eq("client_id", selectedClient.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (sectionsError) {
      return {
        ...initialData(),
        clients: clientOptions,
      };
    }

    const parsedSections = z.array(SectionRowSchema).safeParse(sectionRows);

    if (!parsedSections.success) {
      return {
        ...initialData(),
        clients: clientOptions,
      };
    }

    const { data: totalRows } = await supabase
      .from("section_time_totals")
      .select("section_id, descendant_leaf_count, total_estimated_minutes")
      .eq("client_id", selectedClient.id);
    const parsedTotals = z.array(SectionTotalRowSchema).safeParse(totalRows);
    const totals = new Map(
      parsedTotals.success
        ? parsedTotals.data.map((row) => [row.section_id, row])
        : [],
    );
    const sections = flattenSections(parsedSections.data, totals);
    const selectedSection =
      sections.find((section) => section.id === requestedSectionId) ??
      sections[0];

    if (!selectedSection) {
      return {
        clients: clientOptions,
        leafItems: [],
        ok: true,
        selectedClientId: selectedClient.id,
        selectedSectionId: null,
        sectionOptions: toSectionOptions(sections),
        sections,
      };
    }

    const sectionIds = sections.map((s) => s.id);
    const { data: leafRows, error: leafError } =
      sectionIds.length > 0
        ? await supabase
            .from("leaf_items")
            .select(
              "id, section_id, name, quantity, estimated_minutes, recurrence_days, tag, notes, reference_image_path",
            )
            .in("section_id", sectionIds)
            .order("name", { ascending: true })
        : { data: [], error: null };

    if (leafError) {
      return {
        clients: clientOptions,
        leafItems: [],
        ok: false,
        selectedClientId: selectedClient.id,
        selectedSectionId: selectedSection.id,
        sectionOptions: toSectionOptions(sections),
        sections,
      };
    }

    const parsedLeafItems = z.array(LeafItemRowSchema).safeParse(leafRows);
    const leafItemIds = parsedLeafItems.success
      ? parsedLeafItems.data.map((item) => item.id)
      : [];
    const { data: stepRows } =
      leafItemIds.length > 0
        ? await supabase
            .from("cleaning_tool_steps")
            .select(
              "id, leaf_item_id, sequence_order, tool_name, estimated_minutes, recurrence_days, is_mandatory, notes",
            )
            .in("leaf_item_id", leafItemIds)
            .order("sequence_order", { ascending: true })
        : { data: [] };
    const parsedToolSteps = z
      .array(CleaningToolStepRowSchema)
      .safeParse(stepRows);
    const toolStepIds = parsedToolSteps.success
      ? parsedToolSteps.data.map((step) => step.id)
      : [];
    const { data: lastPerformedRows } =
      toolStepIds.length > 0
        ? await supabase
            .from("cleaning_tool_step_last_performed")
            .select("cleaning_tool_step_id, last_performed_at")
            .in("cleaning_tool_step_id", toolStepIds)
        : { data: [] };
    const parsedLastPerformed = z
      .array(CleaningToolStepLastPerformedRowSchema)
      .safeParse(lastPerformedRows);
    const lastPerformed = new Map(
      parsedLastPerformed.success
        ? parsedLastPerformed.data.map((row) => [
            row.cleaning_tool_step_id,
            row.last_performed_at,
          ])
        : [],
    );
    const stepsByLeafItem = new Map<string, CleaningToolStepListItem[]>();

    if (parsedToolSteps.success) {
      parsedToolSteps.data.forEach((step) => {
        const mappedStep = toCleaningToolStep(step, lastPerformed);
        stepsByLeafItem.set(step.leaf_item_id, [
          ...(stepsByLeafItem.get(step.leaf_item_id) ?? []),
          mappedStep,
        ]);
      });
    }

    return {
      clients: clientOptions,
      leafItems: parsedLeafItems.success
        ? parsedLeafItems.data.map((item) =>
            toLeafItem(item, stepsByLeafItem.get(item.id) ?? []),
          )
        : [],
      ok: parsedLeafItems.success && parsedToolSteps.success,
      selectedClientId: selectedClient.id,
      selectedSectionId: selectedSection.id,
      sectionOptions: toSectionOptions(sections),
      sections,
    };
  } catch {
    return initialData();
  }
}
