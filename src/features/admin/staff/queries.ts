import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type StaffEmployeeOption = Readonly<{
  id: string;
  fullName: string;
}>;

export type StaffClientOption = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
}>;

export type StaffAssignmentListItem = Readonly<{
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  endDate: string | null;
  id: string;
  isActive: boolean;
  startDate: string;
}>;

export type StaffAssignmentsData = Readonly<{
  assignments: readonly StaffAssignmentListItem[];
  clients: readonly StaffClientOption[];
  employees: readonly StaffEmployeeOption[];
  ok: boolean;
}>;

const EmployeeRowSchema = z.object({
  full_name: z.string(),
  id: z.string().uuid(),
});

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
  name: z.string(),
});

const AssignmentRowSchema = z.object({
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  end_date: z.string().nullable(),
  id: z.string().uuid(),
  start_date: z.string(),
});

function initialData(): StaffAssignmentsData {
  return {
    assignments: [],
    clients: [],
    employees: [],
    ok: false,
  };
}

function isActiveAssignment(startDate: string, endDate: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  return startDate <= today && (!endDate || endDate >= today);
}

export async function getStaffAssignmentsData(
  locale: Locale,
): Promise<StaffAssignmentsData> {
  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: employeeRows, error: employeeError },
      { data: clientRows, error: clientError },
      { data: assignmentRows, error: assignmentError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "employee")
        .order("full_name", { ascending: true }),
      supabase
        .from("clients")
        .select("id, name, is_active")
        .order("is_active", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("employee_client_assignments")
        .select("id, employee_id, client_id, start_date, end_date")
        .order("start_date", { ascending: false }),
    ]);

    if (employeeError || clientError || assignmentError) {
      return initialData();
    }

    const employees = z.array(EmployeeRowSchema).safeParse(employeeRows);
    const clients = z.array(ClientRowSchema).safeParse(clientRows);
    const assignments = z.array(AssignmentRowSchema).safeParse(assignmentRows);

    if (!employees.success || !clients.success || !assignments.success) {
      return initialData();
    }

    const employeeMap = new Map(
      employees.data.map((employee) => [employee.id, employee.full_name]),
    );
    const clientMap = new Map(
      clients.data.map((client) => [client.id, client.name]),
    );

    return {
      assignments: assignments.data.map((assignment) => ({
        clientId: assignment.client_id,
        clientName: clientMap.get(assignment.client_id) ?? "",
        employeeId: assignment.employee_id,
        employeeName: employeeMap.get(assignment.employee_id) ?? "",
        endDate: assignment.end_date,
        id: assignment.id,
        isActive: isActiveAssignment(
          assignment.start_date,
          assignment.end_date,
        ),
        startDate: assignment.start_date,
      })),
      clients: clients.data.map((client) => ({
        id: client.id,
        isActive: client.is_active,
        name: client.name,
      })),
      employees: employees.data.map((employee) => ({
        fullName: employee.full_name,
        id: employee.id,
      })),
      ok: true,
    };
  } catch {
    return initialData();
  }
}
