"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";

import {
  buildClientContactInfo,
  clientFieldErrors,
  ClientFormDataKeys,
  CreateClientInputSchema,
  initialClientActionState,
  SetClientActiveInputSchema,
  UpdateClientInputSchema,
  type ClientActionState,
} from "./schema";

type ClientDbInsert = Readonly<{
  address: string;
  contact_info: Record<string, string>;
  is_active: boolean;
  name: string;
}>;

type ClientDbUpdate = Readonly<{
  address?: string;
  contact_info?: Record<string, string>;
  is_active?: boolean;
  name?: string;
}>;

function validationFailure(fieldErrors = {}): ClientActionState {
  return {
    code: "VALIDATION_FAILED",
    fieldErrors,
    status: "error",
  };
}

async function assertAdminMutation(locale: "de" | "en") {
  if (!(await hasSameOriginRequest())) {
    return false;
  }

  await requireRole(locale, "admin");
  return true;
}

export async function createClientAction(
  _previousState: ClientActionState = initialClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ClientFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateClientInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(clientFieldErrors(parsed.error));
  }

  const dto = parsed.data;

  if (!(await assertAdminMutation(dto.locale))) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const insert: ClientDbInsert = {
    address: dto.address,
    contact_info: buildClientContactInfo(dto),
    is_active: true,
    name: dto.name,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("clients").insert(insert);

    if (error) {
      return { code: "SAVE_FAILED", status: "error" };
    }
  } catch {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidatePath(`/${dto.locale}/admin/clients`);
  revalidatePath(`/${dto.locale}/admin`);
  return { code: "CLIENT_CREATED", status: "success" };
}

export async function updateClientAction(
  _previousState: ClientActionState = initialClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...ClientFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateClientInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(clientFieldErrors(parsed.error));
  }

  const dto = parsed.data;

  if (!(await assertAdminMutation(dto.locale))) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const update: ClientDbUpdate = {
    address: dto.address,
    contact_info: buildClientContactInfo(dto),
    name: dto.name,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("clients")
      .update(update)
      .eq("id", dto.id);

    if (error) {
      return { code: "SAVE_FAILED", status: "error" };
    }
  } catch {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidatePath(`/${dto.locale}/admin/clients`);
  revalidatePath(`/${dto.locale}/admin`);
  return { code: "CLIENT_UPDATED", status: "success" };
}

export async function setClientActiveAction(
  _previousState: ClientActionState = initialClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", "locale", "nextIsActive"]);
  } catch {
    return validationFailure();
  }

  const parsed = SetClientActiveInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(clientFieldErrors(parsed.error));
  }

  const dto = parsed.data;

  if (!(await assertAdminMutation(dto.locale))) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const update: ClientDbUpdate = {
    is_active: dto.nextIsActive,
  };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("clients")
      .update(update)
      .eq("id", dto.id);

    if (error) {
      return { code: "SAVE_FAILED", status: "error" };
    }
  } catch {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidatePath(`/${dto.locale}/admin/clients`);
  revalidatePath(`/${dto.locale}/admin`);
  return { code: "STATUS_UPDATED", status: "success" };
}

export async function purgeSportCityClientAction(locale: "de" | "en" = "de"): Promise<{ ok: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .ilike("name", "%SportCity%");

    if (!clients || clients.length === 0) {
      return { ok: true };
    }

    for (const client of clients) {
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("client_id", client.id);

      const sectionIds = (sections || []).map((s) => s.id);

      if (sectionIds.length > 0) {
        const { data: leafItems } = await supabase
          .from("leaf_items")
          .select("id")
          .in("section_id", sectionIds);

        const leafItemIds = (leafItems || []).map((l) => l.id);

        if (leafItemIds.length > 0) {
          await supabase.from("cleaning_tool_steps").delete().in("leaf_item_id", leafItemIds);
          await supabase.from("leaf_item_last_cleaned").delete().in("leaf_item_id", leafItemIds);
          await supabase.from("daily_plan_items").delete().in("leaf_item_id", leafItemIds);
          await supabase.from("leaf_items").delete().in("section_id", sectionIds);
        }

        await supabase.from("sections").delete().eq("client_id", client.id);
      }

      await supabase.from("work_schedule").delete().eq("client_id", client.id);
      await supabase.from("employee_client_assignments").delete().eq("client_id", client.id);
      await supabase.from("daily_plans").delete().eq("client_id", client.id);
      await supabase.from("clients").delete().eq("id", client.id);
    }

    revalidatePath(`/${locale}/admin/clients`);
    revalidatePath(`/${locale}/admin`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
