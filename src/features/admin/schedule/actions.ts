"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";

import {
  CreateScheduleInputSchema,
  DeleteScheduleInputSchema,
  initialScheduleActionState,
  ScheduleFormDataKeys,
  scheduleFieldErrors,
  UpdateScheduleInputSchema,
  type CreateScheduleCommandDto,
  type ScheduleActionState,
  type UpdateScheduleCommandDto,
} from "./schema";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type ScheduleDbInsert = Readonly<{
  allocated_hours: number;
  client_id: string;
  employee_id: string;
  work_date: string;
}>;

type ScheduleDbUpdate = Readonly<{
  allocated_hours?: number;
  client_id?: string;
  employee_id?: string;
  work_date?: string;
}>;

function validationFailure(fieldErrors = {}): ScheduleActionState {
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

async function hasActiveAssignmentForDate(
  supabase: SupabaseServerClient,
  dto: CreateScheduleCommandDto | UpdateScheduleCommandDto,
) {
  const { data, error } = await supabase
    .from("employee_client_assignments")
    .select("id")
    .eq("employee_id", dto.employeeId)
    .eq("client_id", dto.clientId)
    .lte("start_date", dto.workDate)
    .or(`end_date.is.null,end_date.gte.${dto.workDate}`)
    .limit(1);

  return !error && Array.isArray(data) && data.length > 0;
}

function revalidateSchedule(locale: "de" | "en") {
  revalidatePath(`/${locale}/admin/schedule`);
  revalidatePath(`/${locale}/admin`);
}

export async function createScheduleAction(
  _previousState: ScheduleActionState = initialScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ScheduleFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateScheduleInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(scheduleFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await hasActiveAssignmentForDate(supabase, dto))) {
    return validationFailure({ clientId: "invalid", employeeId: "invalid" });
  }

  const insert: ScheduleDbInsert = {
    allocated_hours: dto.allocatedHours,
    client_id: dto.clientId,
    employee_id: dto.employeeId,
    work_date: dto.workDate,
  };

  const { error } = await supabase.from("work_schedule").insert(insert);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSchedule(dto.locale);
  return { code: "SAVED", status: "success" };
}

export async function updateScheduleAction(
  _previousState: ScheduleActionState = initialScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...ScheduleFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateScheduleInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(scheduleFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  if (!(await hasActiveAssignmentForDate(supabase, dto))) {
    return validationFailure({ clientId: "invalid", employeeId: "invalid" });
  }

  const update: ScheduleDbUpdate = {
    allocated_hours: dto.allocatedHours,
    client_id: dto.clientId,
    employee_id: dto.employeeId,
    work_date: dto.workDate,
  };

  const { error } = await supabase
    .from("work_schedule")
    .update(update)
    .eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSchedule(dto.locale);
  return { code: "SAVED", status: "success" };
}

export async function deleteScheduleAction(
  _previousState: ScheduleActionState = initialScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", "locale"]);
  } catch {
    return validationFailure();
  }

  const parsed = DeleteScheduleInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(scheduleFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const { error } = await supabase
    .from("work_schedule")
    .delete()
    .eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateSchedule(dto.locale);
  return { code: "DELETED", status: "success" };
}
