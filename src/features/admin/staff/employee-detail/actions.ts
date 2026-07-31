"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";

import {
  SetWeeklyAvailabilityInputSchema,
  UpdateEmployeeProfileInputSchema,
  WeeklyAvailabilityFormDataKeys,
  EmployeeProfileFormDataKeys,
  employeeProfileFieldErrors,
  initialEmployeeProfileActionState,
  initialWeeklyAvailabilityActionState,
  weeklyAvailabilityFieldErrors,
  DefaultDailyHoursFormDataKeys,
  SetDefaultDailyHoursInputSchema,
  defaultDailyHoursFieldErrors,
  initialDefaultDailyHoursActionState,
  type DefaultDailyHoursActionState,
  type EmployeeProfileActionState,
  type WeeklyAvailabilityActionState,
} from "./schema";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function profileValidationFailure(
  fieldErrors: EmployeeProfileActionState["fieldErrors"] = {},
): EmployeeProfileActionState {
  return {
    code: "VALIDATION_FAILED",
    fieldErrors,
    status: "error",
  };
}

function availabilityValidationFailure(
  fieldErrors: WeeklyAvailabilityActionState["fieldErrors"] = {},
): WeeklyAvailabilityActionState {
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

async function employeeExists(
  supabase: SupabaseServerClient,
  employeeId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", employeeId)
    .eq("role", "employee")
    .maybeSingle();

  return !error && Boolean(data);
}

function revalidateEmployeeDetail(locale: "de" | "en", employeeId: string) {
  revalidatePath(`/${locale}/admin/staff/${employeeId}`);
  revalidatePath(`/${locale}/admin`);
}

export async function updateEmployeeProfileAction(
  _previousState: EmployeeProfileActionState = initialEmployeeProfileActionState,
  formData: FormData,
): Promise<EmployeeProfileActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, EmployeeProfileFormDataKeys);
  } catch {
    return profileValidationFailure();
  }

  const parsed = UpdateEmployeeProfileInputSchema.safeParse(raw);

  if (!parsed.success) {
    return profileValidationFailure(employeeProfileFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await employeeExists(supabase, dto.employeeId))) {
    return profileValidationFailure({ employeeId: "invalid" });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: dto.fullName })
    .eq("id", dto.employeeId)
    .eq("role", "employee");

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateEmployeeDetail(dto.locale, dto.employeeId);
  return { code: "SAVED", status: "success" };
}

export async function setWeeklyAvailabilityAction(
  _previousState: WeeklyAvailabilityActionState = initialWeeklyAvailabilityActionState,
  formData: FormData,
): Promise<WeeklyAvailabilityActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, WeeklyAvailabilityFormDataKeys);
  } catch {
    return availabilityValidationFailure();
  }

  const parsed = SetWeeklyAvailabilityInputSchema.safeParse(raw);

  if (!parsed.success) {
    return availabilityValidationFailure(
      weeklyAvailabilityFieldErrors(parsed.error),
    );
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await employeeExists(supabase, dto.employeeId))) {
    return availabilityValidationFailure({ employeeId: "invalid" });
  }

  const { error } = await supabase.from("employee_weekly_availability").upsert(
    {
      employee_id: dto.employeeId,
      is_available: dto.isAvailable,
      weekday: dto.weekday,
    },
    { onConflict: "employee_id,weekday" },
  );

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateEmployeeDetail(dto.locale, dto.employeeId);
  return { code: "SAVED", status: "success" };
}

export async function setDefaultDailyHoursAction(
  _previousState: DefaultDailyHoursActionState = initialDefaultDailyHoursActionState,
  formData: FormData,
): Promise<DefaultDailyHoursActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, DefaultDailyHoursFormDataKeys);
  } catch {
    return { code: "VALIDATION_FAILED", status: "error" };
  }

  const parsed = SetDefaultDailyHoursInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      code: "VALIDATION_FAILED",
      fieldErrors: defaultDailyHoursFieldErrors(parsed.error),
      status: "error",
    };
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await employeeExists(supabase, dto.employeeId))) {
    return {
      code: "VALIDATION_FAILED",
      fieldErrors: { employeeId: "invalid" },
      status: "error",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ default_daily_hours: dto.defaultDailyHours ?? null })
    .eq("id", dto.employeeId)
    .eq("role", "employee");

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateEmployeeDetail(dto.locale, dto.employeeId);
  return { code: "SAVED", status: "success" };
}
