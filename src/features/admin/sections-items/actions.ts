"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";

import {
  AttachReferenceImageInputSchema,
  CleaningToolStepFormDataKeys,
  CreateCleaningToolStepInputSchema,
  CreateLeafItemInputSchema,
  CreateSectionInputSchema,
  DeleteCleaningToolStepInputSchema,
  DeleteLeafItemInputSchema,
  DeleteSectionInputSchema,
  initialSectionsItemsActionState,
  LeafItemFormDataKeys,
  SectionFormDataKeys,
  sectionsItemsFieldErrors,
  UpdateCleaningToolStepInputSchema,
  UpdateLeafItemInputSchema,
  UpdateSectionInputSchema,
  type AttachReferenceImageCommandDto,
  type CreateCleaningToolStepCommandDto,
  type CreateLeafItemCommandDto,
  type CreateSectionCommandDto,
  type DeleteCleaningToolStepCommandDto,
  type DeleteLeafItemCommandDto,
  type DeleteSectionCommandDto,
  type SectionsItemsActionState,
  type UpdateCleaningToolStepCommandDto,
  type UpdateLeafItemCommandDto,
  type UpdateSectionCommandDto,
} from "./schema";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type SectionDbInsert = Readonly<{
  client_id: string;
  name: string;
  parent_section_id: string | null;
  sort_order: number;
}>;

type SectionDbUpdate = Readonly<{
  name?: string;
  parent_section_id?: string | null;
  reference_image_path?: string | null;
  sort_order?: number;
}>;

type LeafItemDbInsert = Readonly<{
  estimated_minutes: number;
  name: string;
  notes: string | null;
  quantity: number;
  recurrence_days: number | null;
  section_id: string;
  tag: string;
}>;

type LeafItemDbUpdate = Readonly<{
  estimated_minutes?: number;
  name?: string;
  notes?: string | null;
  quantity?: number;
  recurrence_days?: number | null;
  reference_image_path?: string | null;
  section_id?: string;
  tag?: string;
}>;

type CleaningToolStepDbInsert = Readonly<{
  estimated_minutes: number;
  is_mandatory: boolean;
  leaf_item_id: string;
  notes: string | null;
  recurrence_days: number;
  sequence_order: number;
  tool_name: string;
}>;

type CleaningToolStepDbUpdate = Readonly<{
  estimated_minutes?: number;
  is_mandatory?: boolean;
  notes?: string | null;
  recurrence_days?: number;
  sequence_order?: number;
  tool_name?: string;
}>;

type ScopedEntity = Readonly<{
  referenceImagePath: string | null;
}>;

const ReferenceImageTypes = {
  "image/jpeg": {
    extension: "jpg",
    magic: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    magic: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    extension: "webp",
    magic: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
} as const;

const MaxReferenceImageBytes = 5 * 1024 * 1024;
const MaxReferenceImagePixelsPerSide = 6000;

function validationFailure(fieldErrors = {}): SectionsItemsActionState {
  return {
    code: "VALIDATION_FAILED",
    fieldErrors,
    status: "error",
  };
}

async function getAdminMutationClient(locale: "de" | "en") {
  if (!(await hasSameOriginRequest())) {
    return null;
  }

  await requireRole(locale, "admin");

  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

async function sectionBelongsToClient(
  supabase: SupabaseServerClient,
  sectionId: string,
  clientId: string,
): Promise<ScopedEntity | null> {
  const { data, error } = await supabase
    .from("sections")
    .select("reference_image_path")
    .eq("id", sectionId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    referenceImagePath:
      typeof data.reference_image_path === "string"
        ? data.reference_image_path
        : null,
  };
}

async function leafItemBelongsToClient(
  supabase: SupabaseServerClient,
  leafItemId: string,
  clientId: string,
): Promise<ScopedEntity | null> {
  const { data: item, error: itemError } = await supabase
    .from("leaf_items")
    .select("section_id, reference_image_path")
    .eq("id", leafItemId)
    .maybeSingle();

  if (itemError || !item || typeof item.section_id !== "string") {
    return null;
  }

  const section = await sectionBelongsToClient(
    supabase,
    item.section_id,
    clientId,
  );

  if (!section) {
    return null;
  }

  return {
    referenceImagePath:
      typeof item.reference_image_path === "string"
        ? item.reference_image_path
        : null,
  };
}

async function cleaningToolStepBelongsToClient(
  supabase: SupabaseServerClient,
  stepId: string,
  leafItemId: string,
  clientId: string,
) {
  const { data: step, error: stepError } = await supabase
    .from("cleaning_tool_steps")
    .select("leaf_item_id")
    .eq("id", stepId)
    .eq("leaf_item_id", leafItemId)
    .maybeSingle();

  if (stepError || !step || typeof step.leaf_item_id !== "string") {
    return false;
  }

  return Boolean(
    await leafItemBelongsToClient(supabase, step.leaf_item_id, clientId),
  );
}

async function validateSectionScope(
  supabase: SupabaseServerClient,
  dto: CreateSectionCommandDto | UpdateSectionCommandDto,
) {
  if (
    "id" in dto &&
    !(await sectionBelongsToClient(supabase, dto.id, dto.clientId))
  ) {
    return false;
  }

  if (!dto.parentSectionId) {
    return true;
  }

  if ("id" in dto && dto.parentSectionId === dto.id) {
    return false;
  }

  return Boolean(
    await sectionBelongsToClient(supabase, dto.parentSectionId, dto.clientId),
  );
}

async function validateLeafItemScope(
  supabase: SupabaseServerClient,
  dto: CreateLeafItemCommandDto | UpdateLeafItemCommandDto,
) {
  if (
    "id" in dto &&
    !(await leafItemBelongsToClient(supabase, dto.id, dto.clientId))
  ) {
    return false;
  }

  return Boolean(
    await sectionBelongsToClient(supabase, dto.sectionId, dto.clientId),
  );
}

async function validateCleaningToolStepScope(
  supabase: SupabaseServerClient,
  dto: CreateCleaningToolStepCommandDto | UpdateCleaningToolStepCommandDto,
) {
  if (
    !(await leafItemBelongsToClient(supabase, dto.leafItemId, dto.clientId))
  ) {
    return false;
  }

  if ("id" in dto) {
    return cleaningToolStepBelongsToClient(
      supabase,
      dto.id,
      dto.leafItemId,
      dto.clientId,
    );
  }

  return true;
}

function revalidateSectionsItems(locale: "de" | "en", clientId: string) {
  revalidatePath(`/${locale}/admin/sections-items`);
  revalidatePath(`/${locale}/admin/sections-items?clientId=${clientId}`);
  revalidatePath(`/${locale}/admin`);
}

export async function createSectionAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, SectionFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateSectionInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateSectionScope(supabase, dto))) {
    return validationFailure({ parentSectionId: "invalid" });
  }

  const insert: SectionDbInsert = {
    client_id: dto.clientId,
    name: dto.name,
    parent_section_id: dto.parentSectionId,
    sort_order: dto.sortOrder,
  };

  const { error } = await supabase.from("sections").insert(insert);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function updateSectionAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...SectionFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateSectionInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateSectionScope(supabase, dto))) {
    return validationFailure({ parentSectionId: "invalid" });
  }

  const update: SectionDbUpdate = {
    name: dto.name,
    parent_section_id: dto.parentSectionId,
    sort_order: dto.sortOrder,
  };

  const { error } = await supabase
    .from("sections")
    .update(update)
    .eq("id", dto.id)
    .eq("client_id", dto.clientId);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function deleteSectionAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["clientId", "id", "locale"]);
  } catch {
    return validationFailure();
  }

  const parsed = DeleteSectionInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto: DeleteSectionCommandDto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const scoped = await sectionBelongsToClient(supabase, dto.id, dto.clientId);

  if (!scoped) {
    return validationFailure({ id: "invalid" });
  }

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", dto.id)
    .eq("client_id", dto.clientId);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  if (scoped.referenceImagePath) {
    await supabase.storage
      .from("reference-images")
      .remove([scoped.referenceImagePath]);
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "DELETED", status: "success" };
}

export async function createLeafItemAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, LeafItemFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateLeafItemInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateLeafItemScope(supabase, dto))) {
    return validationFailure({ sectionId: "invalid" });
  }

  const insert: LeafItemDbInsert = {
    estimated_minutes: dto.estimatedMinutes,
    name: dto.name,
    notes: dto.notes,
    quantity: dto.quantity,
    recurrence_days: dto.recurrenceDays ?? null,
    section_id: dto.sectionId,
    tag: dto.tag,
  };

  const { error } = await supabase.from("leaf_items").insert(insert);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function updateLeafItemAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...LeafItemFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateLeafItemInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateLeafItemScope(supabase, dto))) {
    return validationFailure({ sectionId: "invalid" });
  }

  const update: LeafItemDbUpdate = {
    estimated_minutes: dto.estimatedMinutes,
    name: dto.name,
    notes: dto.notes,
    quantity: dto.quantity,
    recurrence_days: dto.recurrenceDays ?? null,
    section_id: dto.sectionId,
    tag: dto.tag,
  };

  const { error } = await supabase
    .from("leaf_items")
    .update(update)
    .eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function deleteLeafItemAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["clientId", "id", "locale"]);
  } catch {
    return validationFailure();
  }

  const parsed = DeleteLeafItemInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto: DeleteLeafItemCommandDto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const scoped = await leafItemBelongsToClient(supabase, dto.id, dto.clientId);

  if (!scoped) {
    return validationFailure({ id: "invalid" });
  }

  const { error } = await supabase.from("leaf_items").delete().eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  if (scoped.referenceImagePath) {
    await supabase.storage
      .from("reference-images")
      .remove([scoped.referenceImagePath]);
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "DELETED", status: "success" };
}

export async function createCleaningToolStepAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, CleaningToolStepFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateCleaningToolStepInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateCleaningToolStepScope(supabase, dto))) {
    return validationFailure({ leafItemId: "invalid" });
  }

  const insert: CleaningToolStepDbInsert = {
    estimated_minutes: dto.estimatedMinutes,
    is_mandatory: dto.isMandatory,
    leaf_item_id: dto.leafItemId,
    notes: dto.notes,
    recurrence_days: dto.recurrenceDays,
    sequence_order: dto.sequenceOrder,
    tool_name: dto.toolName,
  };

  const { error } = await supabase.from("cleaning_tool_steps").insert(insert);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function updateCleaningToolStepAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...CleaningToolStepFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateCleaningToolStepInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await validateCleaningToolStepScope(supabase, dto))) {
    return validationFailure({ id: "invalid" });
  }

  const update: CleaningToolStepDbUpdate = {
    estimated_minutes: dto.estimatedMinutes,
    is_mandatory: dto.isMandatory,
    notes: dto.notes,
    recurrence_days: dto.recurrenceDays,
    sequence_order: dto.sequenceOrder,
    tool_name: dto.toolName,
  };

  const { error } = await supabase
    .from("cleaning_tool_steps")
    .update(update)
    .eq("id", dto.id)
    .eq("leaf_item_id", dto.leafItemId);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "SAVED", status: "success" };
}

export async function deleteCleaningToolStepAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["clientId", "id", "leafItemId", "locale"]);
  } catch {
    return validationFailure();
  }

  const parsed = DeleteCleaningToolStepInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto: DeleteCleaningToolStepCommandDto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (
    !(await cleaningToolStepBelongsToClient(
      supabase,
      dto.id,
      dto.leafItemId,
      dto.clientId,
    ))
  ) {
    return validationFailure({ id: "invalid" });
  }

  const { error } = await supabase
    .from("cleaning_tool_steps")
    .delete()
    .eq("id", dto.id)
    .eq("leaf_item_id", dto.leafItemId);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "DELETED", status: "success" };
}

function pickReferenceImageFormData(formData: FormData) {
  const allowedKeys = new Set([
    "clientId",
    "entityId",
    "entityKind",
    "locale",
    "referenceImage",
  ]);
  const raw: Record<string, string | undefined> = {};

  for (const key of formData.keys()) {
    if (key.startsWith("$ACTION_")) {
      continue;
    }

    if (!allowedKeys.has(key)) {
      throw new Error("Unexpected form field.");
    }
  }

  ["clientId", "entityId", "entityKind", "locale"].forEach((key) => {
    const values = formData.getAll(key);

    if (values.length > 1) {
      throw new Error("Duplicate form field.");
    }

    const [value] = values;

    if (typeof value !== "string") {
      throw new Error("Unexpected scalar field.");
    }

    raw[key] = value;
  });

  const files = formData.getAll("referenceImage");

  if (files.length !== 1 || !(files[0] instanceof File)) {
    throw new Error("Missing reference image.");
  }

  return { file: files[0], raw };
}

async function validateReferenceImage(file: File) {
  const imageType =
    ReferenceImageTypes[file.type as keyof typeof ReferenceImageTypes];

  if (!imageType || file.size <= 0 || file.size > MaxReferenceImageBytes) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!imageType.magic(buffer)) {
    return null;
  }

  try {
    const metadata = await sharp(buffer).metadata();

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MaxReferenceImagePixelsPerSide ||
      metadata.height > MaxReferenceImagePixelsPerSide
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    buffer,
    contentType: file.type,
    extension: imageType.extension,
  };
}

function referenceImageObjectName(
  dto: AttachReferenceImageCommandDto,
  extension: string,
) {
  const entityPath = dto.entityKind === "section" ? "sections" : "leaf-items";
  return `${dto.clientId}/${entityPath}/${dto.entityId}/${randomUUID()}.${extension}`;
}

async function scopedEntityForImage(
  supabase: SupabaseServerClient,
  dto: AttachReferenceImageCommandDto,
) {
  return dto.entityKind === "section"
    ? sectionBelongsToClient(supabase, dto.entityId, dto.clientId)
    : leafItemBelongsToClient(supabase, dto.entityId, dto.clientId);
}

async function updateReferenceImagePath(
  supabase: SupabaseServerClient,
  dto: AttachReferenceImageCommandDto,
  path: string,
) {
  const update = {
    reference_image_path: path,
  } satisfies SectionDbUpdate | LeafItemDbUpdate;

  return dto.entityKind === "section"
    ? supabase
        .from("sections")
        .update(update)
        .eq("id", dto.entityId)
        .eq("client_id", dto.clientId)
    : supabase.from("leaf_items").update(update).eq("id", dto.entityId);
}

export async function attachReferenceImageAction(
  _previousState: SectionsItemsActionState = initialSectionsItemsActionState,
  formData: FormData,
): Promise<SectionsItemsActionState> {
  void _previousState;

  let picked;

  try {
    picked = pickReferenceImageFormData(formData);
  } catch {
    return validationFailure();
  }

  const parsed = AttachReferenceImageInputSchema.safeParse(picked.raw);

  if (!parsed.success) {
    return validationFailure(sectionsItemsFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const scopedEntity = await scopedEntityForImage(supabase, dto);

  if (!scopedEntity) {
    return validationFailure({ entityId: "invalid" });
  }

  const image = await validateReferenceImage(picked.file);

  if (!image) {
    return validationFailure({ referenceImage: "invalid" });
  }

  const objectName = referenceImageObjectName(dto, image.extension);
  const bucket = supabase.storage.from("reference-images");
  const { error: uploadError } = await bucket.upload(objectName, image.buffer, {
    contentType: image.contentType,
    upsert: false,
  });

  if (uploadError) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  const { error: updateError } = await updateReferenceImagePath(
    supabase,
    dto,
    objectName,
  );

  if (updateError) {
    await bucket.remove([objectName]);
    return { code: "SAVE_FAILED", status: "error" };
  }

  if (scopedEntity.referenceImagePath) {
    await bucket.remove([scopedEntity.referenceImagePath]);
  }

  revalidateSectionsItems(dto.locale, dto.clientId);
  return { code: "IMAGE_ATTACHED", status: "success" };
}

/* ─────────────────────────────────────────────────────────────────────────
   Quick Rename — lightweight single-field update for inline editing
   ───────────────────────────────────────────────────────────────────────── */

export type QuickRenameResult = Readonly<{
  ok: boolean;
  error?: string;
}>;

/**
 * Renames a section in-place without touching other fields.
 * Accepts: sectionId, clientId, locale, name (via FormData)
 */
export async function quickRenameSectionAction(
  formData: FormData,
): Promise<QuickRenameResult> {
  if (!(await hasSameOriginRequest())) return { ok: false, error: "AUTH_FAILED" };

  const sectionId = formData.get("sectionId");
  const clientId  = formData.get("clientId");
  const locale    = formData.get("locale");
  const name      = formData.get("name");

  if (
    typeof sectionId !== "string" ||
    typeof clientId  !== "string" ||
    typeof locale    !== "string" ||
    typeof name      !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 160
  ) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  try {
    await requireRole(locale as "de" | "en", "admin");
  } catch {
    return { ok: false, error: "AUTH_FAILED" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("sections")
    .update({ name: name.trim() })
    .eq("id", sectionId)
    .eq("client_id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateSectionsItems(locale as "de" | "en", clientId);
  return { ok: true };
}

/**
 * Renames a leaf item in-place without touching other fields.
 * Accepts: leafItemId, clientId, locale, name (via FormData)
 */
export async function quickRenameLeafItemAction(
  formData: FormData,
): Promise<QuickRenameResult> {
  if (!(await hasSameOriginRequest())) return { ok: false, error: "AUTH_FAILED" };

  const leafItemId = formData.get("leafItemId");
  const clientId   = formData.get("clientId");
  const locale     = formData.get("locale");
  const name       = formData.get("name");

  if (
    typeof leafItemId !== "string" ||
    typeof clientId   !== "string" ||
    typeof locale     !== "string" ||
    typeof name       !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 160
  ) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  try {
    await requireRole(locale as "de" | "en", "admin");
  } catch {
    return { ok: false, error: "AUTH_FAILED" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("leaf_items")
    .update({ name: name.trim() })
    .eq("id", leafItemId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateSectionsItems(locale as "de" | "en", clientId);
  return { ok: true };
}

/**
 * Deletes a section (and its cascade child items).
 */
export async function quickDeleteSectionAction(
  formData: FormData,
): Promise<QuickRenameResult> {
  if (!(await hasSameOriginRequest())) return { ok: false, error: "AUTH_FAILED" };

  const sectionId = formData.get("sectionId");
  const clientId  = formData.get("clientId");
  const locale    = formData.get("locale");

  if (
    typeof sectionId !== "string" ||
    typeof clientId  !== "string" ||
    typeof locale    !== "string"
  ) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  try {
    await requireRole(locale as "de" | "en", "admin");
  } catch {
    return { ok: false, error: "AUTH_FAILED" };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Find all child sub-sections
  const { data: subSections } = await supabase
    .from("sections")
    .select("id")
    .eq("parent_section_id", sectionId);

  const allSectionIds = [sectionId, ...(subSections?.map((s) => s.id) || [])];

  // 2. Find all leaf items assigned to the main section OR any of its sub-sections
  const { data: leafItems } = await supabase
    .from("leaf_items")
    .select("id")
    .in("section_id", allSectionIds);

  if (leafItems && leafItems.length > 0) {
    const leafIds = leafItems.map((l) => l.id);
    await supabase.from("daily_plan_items").delete().in("leaf_item_id", leafIds);
    await supabase.from("cleaning_tool_steps").delete().in("leaf_item_id", leafIds);
    await supabase.from("leaf_items").delete().in("section_id", allSectionIds);
  }

  // 3. Delete sub-sections first to avoid parent_section_id foreign key constraint
  await supabase.from("sections").delete().eq("parent_section_id", sectionId);

  // 4. Delete main section
  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", sectionId)
    .eq("client_id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateSectionsItems(locale as "de" | "en", clientId);
  return { ok: true };
}

/**
 * Deletes a leaf item.
 */
export async function quickDeleteLeafItemAction(
  formData: FormData,
): Promise<QuickRenameResult> {
  if (!(await hasSameOriginRequest())) return { ok: false, error: "AUTH_FAILED" };

  const leafItemId = formData.get("leafItemId");
  const clientId   = formData.get("clientId");
  const locale     = formData.get("locale");

  if (
    typeof leafItemId !== "string" ||
    typeof clientId   !== "string" ||
    typeof locale     !== "string"
  ) {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  try {
    await requireRole(locale as "de" | "en", "admin");
  } catch {
    return { ok: false, error: "AUTH_FAILED" };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("daily_plan_items").delete().eq("leaf_item_id", leafItemId);
  await supabase.from("cleaning_tool_steps").delete().eq("leaf_item_id", leafItemId);
  const { error } = await supabase.from("leaf_items").delete().eq("id", leafItemId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateSectionsItems(locale as "de" | "en", clientId);
  return { ok: true };
}


