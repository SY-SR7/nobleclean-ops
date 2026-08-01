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
  startTime?: string;
  endTime?: string;
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

    const sanitizeName = (name: string) => name;


    const employeeMap = new Map(
      employees.data.map((employee) => [employee.id, sanitizeName(employee.full_name)]),
    );
    const clientMap = new Map(
      clients.data.map((client) => [client.id, client.name]),
    );
    // Group schedules by work_date and employee_id to handle double-shift rules correctly
    const groupedMap = new Map<string, typeof schedules.data>();
    schedules.data.forEach((item) => {
      const key = `${item.work_date}_${item.employee_id}`;
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)!.push(item);
    });

    const scheduleItems: ScheduleListItem[] = [];
    groupedMap.forEach((items) => {
      const first = items[0];
      const isDouble = items.length >= 2;
      const isSaturday = new Date(first.work_date).getDay() === 6;

      let startTime = "04:00";
      let endTime = "07:00";
      let hours = isDouble ? 6.0 : 3.0;

      if (isSaturday) {
        startTime = "05:30";
        endTime = "08:30";
      } else if (isDouble) {
        startTime = "01:00";
        endTime = "07:00";
      }

      scheduleItems.push({
        allocatedHours: hours,
        clientId: first.client_id,
        clientName: clientMap.get(first.client_id) ?? "",
        employeeId: first.employee_id,
        employeeName: employeeMap.get(first.employee_id) ?? "",
        id: first.id,
        workDate: first.work_date,
        startTime,
        endTime,
      });
    });

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
