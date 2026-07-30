"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";
import { requireRole } from "@/server/auth/guards";

import {
  CreateStaffAssignmentInputSchema,
  EndStaffAssignmentInputSchema,
  initialStaffAssignmentActionState,
  StaffAssignmentFormDataKeys,
  staffAssignmentFieldErrors,
  UpdateStaffAssignmentInputSchema,
  type CreateStaffAssignmentCommandDto,
  type StaffAssignmentActionState,
  type UpdateStaffAssignmentCommandDto,
} from "./schema";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type AssignmentDbInsert = Readonly<{
  client_id: string;
  employee_id: string;
  end_date: string | null;
  start_date: string;
}>;

type AssignmentDbUpdate = Readonly<{
  client_id?: string;
  employee_id?: string;
  end_date?: string | null;
  start_date?: string;
}>;

function validationFailure(fieldErrors = {}): StaffAssignmentActionState {
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

async function clientExists(supabase: SupabaseServerClient, clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  return !error && Boolean(data);
}

async function hasOverlappingAssignment(
  supabase: SupabaseServerClient,
  dto: CreateStaffAssignmentCommandDto | UpdateStaffAssignmentCommandDto,
) {
  const effectiveEndDate = dto.endDate ?? "9999-12-31";
  let query = supabase
    .from("employee_client_assignments")
    .select("id")
    .eq("employee_id", dto.employeeId)
    .lte("start_date", effectiveEndDate)
    .or(`end_date.is.null,end_date.gte.${dto.startDate}`)
    .limit(1);

  if ("id" in dto) {
    query = query.neq("id", dto.id);
  }

  const { data, error } = await query;

  return !error && Array.isArray(data) && data.length > 0;
}

async function validateAssignmentScope(
  supabase: SupabaseServerClient,
  dto: CreateStaffAssignmentCommandDto | UpdateStaffAssignmentCommandDto,
) {
  const [employeeOk, clientOk, overlaps] = await Promise.all([
    employeeExists(supabase, dto.employeeId),
    clientExists(supabase, dto.clientId),
    hasOverlappingAssignment(supabase, dto),
  ]);

  return {
    clientOk,
    employeeOk,
    overlaps,
  };
}

function revalidateStaff(locale: "de" | "en") {
  revalidatePath(`/${locale}/admin/staff`);
  revalidatePath(`/${locale}/admin`);
}

export async function createStaffAssignmentAction(
  _previousState: StaffAssignmentActionState = initialStaffAssignmentActionState,
  formData: FormData,
): Promise<StaffAssignmentActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, StaffAssignmentFormDataKeys);
  } catch {
    return validationFailure();
  }

  const parsed = CreateStaffAssignmentInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(staffAssignmentFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const scope = await validateAssignmentScope(supabase, dto);

  if (!scope.employeeOk) {
    return validationFailure({ employeeId: "invalid" });
  }

  if (!scope.clientOk) {
    return validationFailure({ clientId: "invalid" });
  }

  if (scope.overlaps) {
    return validationFailure({ endDate: "invalid", startDate: "invalid" });
  }

  const insert: AssignmentDbInsert = {
    client_id: dto.clientId,
    employee_id: dto.employeeId,
    end_date: dto.endDate,
    start_date: dto.startDate,
  };

  const { error } = await supabase
    .from("employee_client_assignments")
    .insert(insert);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateStaff(dto.locale);
  return { code: "SAVED", status: "success" };
}

export async function updateStaffAssignmentAction(
  _previousState: StaffAssignmentActionState = initialStaffAssignmentActionState,
  formData: FormData,
): Promise<StaffAssignmentActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", ...StaffAssignmentFormDataKeys]);
  } catch {
    return validationFailure();
  }

  const parsed = UpdateStaffAssignmentInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(staffAssignmentFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const scope = await validateAssignmentScope(supabase, dto);

  if (!scope.employeeOk) {
    return validationFailure({ employeeId: "invalid" });
  }

  if (!scope.clientOk) {
    return validationFailure({ clientId: "invalid" });
  }

  if (scope.overlaps) {
    return validationFailure({ endDate: "invalid", startDate: "invalid" });
  }

  const update: AssignmentDbUpdate = {
    client_id: dto.clientId,
    employee_id: dto.employeeId,
    end_date: dto.endDate,
    start_date: dto.startDate,
  };

  const { error } = await supabase
    .from("employee_client_assignments")
    .update(update)
    .eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateStaff(dto.locale);
  return { code: "SAVED", status: "success" };
}

export async function endStaffAssignmentAction(
  _previousState: StaffAssignmentActionState = initialStaffAssignmentActionState,
  formData: FormData,
): Promise<StaffAssignmentActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["id", "locale"]);
  } catch {
    return validationFailure();
  }

  const parsed = EndStaffAssignmentInputSchema.safeParse(raw);

  if (!parsed.success) {
    return validationFailure(staffAssignmentFieldErrors(parsed.error));
  }

  const dto = parsed.data;
  const supabase = await getAdminMutationClient(dto.locale);

  if (!supabase) {
    return { code: "AUTH_FAILED", status: "error" };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("employee_client_assignments")
    .select("start_date")
    .eq("id", dto.id)
    .maybeSingle();

  if (
    assignmentError ||
    !assignment ||
    typeof assignment.start_date !== "string"
  ) {
    return validationFailure({ id: "invalid" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const endDate = assignment.start_date > today ? assignment.start_date : today;
  const update: AssignmentDbUpdate = {
    end_date: endDate,
  };

  const { error } = await supabase
    .from("employee_client_assignments")
    .update(update)
    .eq("id", dto.id);

  if (error) {
    return { code: "SAVE_FAILED", status: "error" };
  }

  revalidateStaff(dto.locale);
  return { code: "ENDED", status: "success" };
}
