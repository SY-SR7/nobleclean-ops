"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { requireRole } from "@/server/auth/guards";

import {
  initialMyDaySelectionActionState,
  myDaySelectionFieldErrors,
  SaveMyDaySelectionInputSchema,
  SubmitMyDayCompletionInputSchema,
  type MyDaySelectionActionState,
} from "./schema";

const SaveSelectionFormDataKeys = [
  "clientId",
  "completeAll",
  "completedLeafItemId",
  "leafItemId",
  "locale",
  "workDate",
] as const;

function validationFailure(fieldErrors = {}): MyDaySelectionActionState {
  return {
    code: "VALIDATION_FAILED",
    fieldErrors,
    status: "error",
  };
}

function pickSelectionFormData(formData: FormData) {
  const allowedKeys = new Set(SaveSelectionFormDataKeys);

  for (const key of formData.keys()) {
    if (key.startsWith("$ACTION_")) {
      continue;
    }

    if (!allowedKeys.has(key as (typeof SaveSelectionFormDataKeys)[number])) {
      throw new Error("Unexpected form field.");
    }
  }

  function scalar(key: "clientId" | "locale" | "workDate") {
    const values = formData.getAll(key);

    if (values.length !== 1) {
      throw new Error("Invalid scalar field.");
    }

    const [value] = values;

    if (typeof value !== "string") {
      throw new Error("Unexpected file field.");
    }

    return value;
  }

  const leafItemIds = formData.getAll("leafItemId").map((value) => {
    if (typeof value !== "string") {
      throw new Error("Unexpected file field.");
    }

    return value;
  });

  return {
    clientId: scalar("clientId"),
    leafItemIds,
    locale: scalar("locale"),
    workDate: scalar("workDate"),
  };
}

function pickCompletionFormData(formData: FormData) {
  const allowedKeys = new Set(SaveSelectionFormDataKeys);

  for (const key of formData.keys()) {
    if (key.startsWith("$ACTION_")) {
      continue;
    }

    if (!allowedKeys.has(key as (typeof SaveSelectionFormDataKeys)[number])) {
      throw new Error("Unexpected form field.");
    }
  }

  function scalar(key: "clientId" | "locale" | "workDate") {
    const values = formData.getAll(key);

    if (values.length !== 1) {
      throw new Error("Invalid scalar field.");
    }

    const [value] = values;

    if (typeof value !== "string") {
      throw new Error("Unexpected file field.");
    }

    return value;
  }

  const completeAllValue = formData.get("completeAll");

  if (
    completeAllValue !== null &&
    completeAllValue !== "true" &&
    completeAllValue !== "false"
  ) {
    throw new Error("Invalid completion mode.");
  }

  const completedLeafItemIds = formData
    .getAll("completedLeafItemId")
    .map((value) => {
      if (typeof value !== "string") {
        throw new Error("Unexpected file field.");
      }

      return value;
    });

  return {
    clientId: scalar("clientId"),
    completeAll: completeAllValue === "true",
    completedLeafItemIds,
    locale: scalar("locale"),
    workDate: scalar("workDate"),
  };
}

function isTooShortSelection(errorMessage: string) {
  return errorMessage.includes("planned_minutes_below_allocated");
}

export async function saveDailyPlanSelectionAction(
  _previousState: MyDaySelectionActionState = initialMyDaySelectionActionState,
  formData: FormData,
): Promise<MyDaySelectionActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickSelectionFormData(formData);
  } catch {
    return validationFailure();
  }

  const parsed = SaveMyDaySelectionInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(myDaySelectionFieldErrors(parsed.error));
  }

  const dto = parsed.data;

  if (!(await hasSameOriginRequest())) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  await requireRole(dto.locale, "employee");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc(
      "save_current_employee_daily_plan_selection",
      {
        selected_leaf_item_ids: dto.leafItemIds,
        target_client_id: dto.clientId,
        target_work_date: dto.workDate,
      },
    );

    if (error) {
      return isTooShortSelection(error.message)
        ? {
            code: "TOO_SHORT",
            fieldErrors: { leafItemIds: "invalid" },
            status: "error",
          }
        : { code: "SAVE_FAILED", status: "error" };
    }

    revalidatePath(`/${dto.locale}/employee`);
    return { code: "SAVED", status: "success" };
  } catch {
    return { code: "SAVE_FAILED", status: "error" };
  }
}

export async function submitDailyPlanCompletionAction(
  _previousState: MyDaySelectionActionState = initialMyDaySelectionActionState,
  formData: FormData,
): Promise<MyDaySelectionActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickCompletionFormData(formData);
  } catch {
    return validationFailure();
  }

  const parsed = SubmitMyDayCompletionInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(myDaySelectionFieldErrors(parsed.error));
  }

  const dto = parsed.data;

  if (!(await hasSameOriginRequest())) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  await requireRole(dto.locale, "employee");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc(
      "submit_current_employee_daily_plan_completion",
      {
        completed_leaf_item_ids: dto.completedLeafItemIds,
        mark_all_done: dto.completeAll,
        target_client_id: dto.clientId,
        target_work_date: dto.workDate,
      },
    );

    if (error) {
      return { code: "SAVE_FAILED", status: "error" };
    }

    revalidatePath(`/${dto.locale}/employee`);
    return { code: "COMPLETED", status: "success" };
  } catch {
    return { code: "SAVE_FAILED", status: "error" };
  }
}
