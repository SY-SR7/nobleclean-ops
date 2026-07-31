"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";
import type { Locale } from "@/i18n/routing";

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
export type ClientDetailActionResult = Readonly<{
  ok: boolean;
  error?: string;
}>;

type ContactInfoUpdate = Readonly<{
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}>;

const LocaleSchema = z.enum(["de", "en"]);
const UuidSchema = z.string().uuid();

/* ─────────────────────────────────────────────────────────────────────────
   Guard helper
   ───────────────────────────────────────────────────────────────────────── */
async function assertAdmin(locale: Locale): Promise<boolean> {
  if (!(await hasSameOriginRequest())) return false;
  try {
    await requireRole(locale, "admin");
    return true;
  } catch {
    return false;
  }
}

function revalidateClient(locale: Locale, clientId: string) {
  revalidatePath(`/${locale}/admin/clients/${clientId}`);
  revalidatePath(`/${locale}/admin`);
}

/* ─────────────────────────────────────────────────────────────────────────
   1. Update client name
   ───────────────────────────────────────────────────────────────────────── */
export async function updateClientNameAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["clientId", "locale", "name"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      clientId: UuidSchema,
      locale: LocaleSchema,
      name: z.string().trim().min(1).max(160),
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, locale, name } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ name })
    .eq("id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   2. Update client address
   ───────────────────────────────────────────────────────────────────────── */
export async function updateClientAddressAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["clientId", "locale", "address"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      clientId: UuidSchema,
      locale: LocaleSchema,
      address: z.string().trim().max(500),
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, locale, address } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ address })
    .eq("id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   3. Update a single contact_info field
   ───────────────────────────────────────────────────────────────────────── */
export async function updateClientContactFieldAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["clientId", "locale", "field", "value"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      clientId: UuidSchema,
      locale: LocaleSchema,
      field: z.enum(["contactName", "email", "phone", "notes"]),
      value: z.string().trim().max(500),
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, locale, field, value } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();

  // Fetch current contact_info
  const { data: row, error: fetchError } = await supabase
    .from("clients")
    .select("contact_info")
    .eq("id", clientId)
    .single();

  if (fetchError || !row) return { ok: false, error: "SAVE_FAILED" };

  const current =
    typeof row.contact_info === "object" && row.contact_info !== null
      ? (row.contact_info as Record<string, unknown>)
      : {};

  const updated: ContactInfoUpdate = { ...current, [field]: value };

  const { error } = await supabase
    .from("clients")
    .update({ contact_info: updated })
    .eq("id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   4. Toggle client active status
   ───────────────────────────────────────────────────────────────────────── */
export async function toggleClientStatusAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["clientId", "locale", "nextIsActive"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      clientId: UuidSchema,
      locale: LocaleSchema,
      nextIsActive: z
        .enum(["true", "false"])
        .transform((v) => v === "true"),
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, locale, nextIsActive } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ is_active: nextIsActive })
    .eq("id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   5. Delete client (guarded: refuses if sections or plans exist)
   ───────────────────────────────────────────────────────────────────────── */
export async function deleteClientAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["clientId", "locale"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({ clientId: UuidSchema, locale: LocaleSchema })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, locale } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();

  // Safety check: block if sections exist
  const { count: sectionCount } = await supabase
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (sectionCount && sectionCount > 0) {
    return { ok: false, error: "HAS_SECTIONS" };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidatePath(`/${locale}/admin`);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   6. Add employee-client assignment (from client detail page)
   ───────────────────────────────────────────────────────────────────────── */
export async function addClientAssignmentAction(
  _prev: unknown,
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, [
      "clientId",
      "employeeId",
      "startDate",
      "endDate",
      "locale",
    ]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      clientId: UuidSchema,
      employeeId: UuidSchema,
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .or(z.literal("")),
      locale: LocaleSchema,
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { clientId, employeeId, startDate, endDate, locale } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("employee_client_assignments").insert({
    client_id: clientId,
    employee_id: employeeId,
    start_date: startDate,
    end_date: endDate || null,
  });

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   7. End assignment (from client detail page)
   ───────────────────────────────────────────────────────────────────────── */
export async function endClientAssignmentAction(
  formData: FormData,
): Promise<ClientDetailActionResult> {
  let raw: Record<string, string>;
  try {
    raw = pickFormData(formData, ["assignmentId", "clientId", "locale"]);
  } catch {
    return { ok: false, error: "VALIDATION_FAILED" };
  }

  const parsed = z
    .object({
      assignmentId: UuidSchema,
      clientId: UuidSchema,
      locale: LocaleSchema,
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, error: "VALIDATION_FAILED" };
  const { assignmentId, clientId, locale } = parsed.data;

  if (!(await assertAdmin(locale))) return { ok: false, error: "AUTH_FAILED" };

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("employee_client_assignments")
    .update({ end_date: today })
    .eq("id", assignmentId);

  if (error) return { ok: false, error: "SAVE_FAILED" };

  revalidateClient(locale, clientId);
  return { ok: true };
}
