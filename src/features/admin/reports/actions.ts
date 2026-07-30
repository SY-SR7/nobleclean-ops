"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";
import type { Locale } from "@/i18n/routing";

export async function updatePlanProgressAction(
  prevState: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const locale = (formData.get("locale") as Locale) || "de";
  const planId = formData.get("planId") as string;
  const status = formData.get("status") as string;
  const completedItems = parseInt(formData.get("completedItems") as string, 10);

  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("daily_cleaning_plans")
      .update({
        status: status || "in_progress",
        completed_items_count: Number.isNaN(completedItems) ? 0 : completedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath(`/${locale}/admin`);
    return { ok: true, message: "Erfolgreich aktualisiert!" };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "Fehler" };
  }
}

export async function markToolStepPerformedAction(
  prevState: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const locale = (formData.get("locale") as Locale) || "de";
  const stepId = formData.get("stepId") as string;
  const dateStr = (formData.get("performedAt") as string) || new Date().toISOString().slice(0, 10);

  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("cleaning_tool_step_last_performed")
      .upsert({
        cleaning_tool_step_id: stepId,
        last_performed_at: dateStr,
      });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath(`/${locale}/admin`);
    return { ok: true, message: "Reinigungsschritt aktualisiert!" };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "Fehler" };
  }
}
