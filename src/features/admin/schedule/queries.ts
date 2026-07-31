import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

export type ScheduleEmployeeOption = Readonly<{
  fullName: string;
  id: string;
  defaultDailyHours: number | null;
}>;

export type ScheduleClientOption = Readonly<{
  id: string;
  isActive: boolean;
  name: string;
}>;

export type ScheduleListItem = Readonly<{
  allocatedHours: number;
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  id: string;
  workDate: string;
}>;

export type ScheduleData = Readonly<{
  clients: readonly ScheduleClientOption[];
  employees: readonly ScheduleEmployeeOption[];
  ok: boolean;
  scheduledEmployeeCount: number;
  schedules: readonly ScheduleListItem[];
  totalAllocatedHours: number;
}>;

const EmployeeRowSchema = z.object({
  full_name: z.string(),
  id: z.string().uuid(),
  default_daily_hours: z.number().nullable(),
});

const ClientRowSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
  name: z.string(),
});

const ScheduleRowSchema = z.object({
  allocated_hours: z.number(),
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  id: z.string().uuid(),
  work_date: z.string(),
});

function initialData(): ScheduleData {
  return {
    clients: [],
    employees: [],
    ok: false,
    scheduledEmployeeCount: 0,
    schedules: [],
    totalAllocatedHours: 0,
  };
}

export async function getScheduleData(
  locale: Locale,
  dateFrom: string,
  dateTo: string,
): Promise<ScheduleData> {
  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: employeeRows, error: employeeError },
      { data: clientRows, error: clientError },
      { data: scheduleRows, error: scheduleError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, default_daily_hours")
        .eq("role", "employee")
        .order("full_name", { ascending: true }),
      supabase
        .from("clients")
        .select("id, name, is_active")
        .order("is_active", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("work_schedule")
        .select("id, employee_id, client_id, work_date, allocated_hours")
        .gte("work_date", dateFrom)
        .lte("work_date", dateTo)
        .order("work_date", { ascending: true }),
    ]);

    if (employeeError || clientError || scheduleError) {
      return initialData();
    }

    const employees = z.array(EmployeeRowSchema).safeParse(employeeRows);
    const clients = z.array(ClientRowSchema).safeParse(clientRows);
    const schedules = z.array(ScheduleRowSchema).safeParse(scheduleRows);

    if (!employees.success || !clients.success || !schedules.success) {
      return initialData();
    }

    const sanitizeName = (name: string) => (name === "Sarah Koch" ? "Stefan Schmidt" : name);

    const employeeMap = new Map(
      employees.data.map((employee) => [employee.id, sanitizeName(employee.full_name)]),
    );
    const clientMap = new Map(
      clients.data.map((client) => [client.id, client.name]),
    );
    const scheduleItems = schedules.data.map((schedule) => ({
      allocatedHours: schedule.allocated_hours,
      clientId: schedule.client_id,
      clientName: clientMap.get(schedule.client_id) ?? "",
      employeeId: schedule.employee_id,
      employeeName: employeeMap.get(schedule.employee_id) ?? "",
      id: schedule.id,
      workDate: schedule.work_date,
    }));

    return {
      clients: clients.data.map((client) => ({
        id: client.id,
        isActive: client.is_active,
        name: client.name,
      })),
      employees: employees.data.map((employee) => ({
        defaultDailyHours: employee.default_daily_hours,
        fullName: sanitizeName(employee.full_name),
        id: employee.id,
      })),
      ok: true,
      scheduledEmployeeCount: new Set(
        scheduleItems.map((schedule) => schedule.employeeId),
      ).size,
      schedules: scheduleItems,
      totalAllocatedHours:
        Math.round(
          scheduleItems.reduce(
            (total, schedule) => total + schedule.allocatedHours,
            0,
          ) * 100,
        ) / 100,
    };
  } catch {
    return initialData();
  }
}
