"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import type { Locale } from "@/i18n/routing";

export async function updatePlanProgressAction(
  prevState: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (!(await hasSameOriginRequest())) return { ok: false, message: "AUTH_FAILED" };

  const locale = (formData.get("locale") as Locale) || "de";
  const planId = formData.get("planId") as string;
  const status = formData.get("status") as string;

  if (!planId || !["in_progress", "submitted"].includes(status)) {
    return { ok: false, message: "Ungültige Eingabe" };
  }

  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();

    // Build update object — submitted_at is required when status=submitted
    const updatePayload: Record<string, unknown> = { status };
    if (status === "submitted") {
      updatePayload.submitted_at = new Date().toISOString();
    } else {
      updatePayload.submitted_at = null;
    }

    const { error } = await supabase
      .from("daily_plans")
      .update(updatePayload)
      .eq("id", planId);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/reports`);
    return { ok: true, message: "Erfolgreich aktualisiert!" };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "Fehler" };
  }
}

export async function markToolStepPerformedAction(
  prevState: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (!(await hasSameOriginRequest())) return { ok: false, message: "AUTH_FAILED" };

  const locale = (formData.get("locale") as Locale) || "de";
  const planItemId = formData.get("planItemId") as string;
  const stepId = formData.get("stepId") as string;

  if (!planItemId || !stepId) {
    return { ok: false, message: "Ungültige Eingabe" };
  }

  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();

    // Mark the step as completed by upserting into daily_plan_item_steps
    const { error } = await supabase
      .from("daily_plan_item_steps")
      .upsert(
        {
          daily_plan_item_id: planItemId,
          cleaning_tool_step_id: stepId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "daily_plan_item_id,cleaning_tool_step_id" },
      );

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/reports`);
    return { ok: true, message: "Reinigungsschritt aktualisiert!" };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "Fehler" };
  }
}
