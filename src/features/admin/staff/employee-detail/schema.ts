import { z } from "zod";

export type EmployeeProfileField = "employeeId" | "fullName" | "locale";

export type DefaultDailyHoursField = "defaultDailyHours" | "employeeId" | "locale";

export type EmployeeProfileActionState = Readonly<{
  code: "AUTH_FAILED" | "SAVED" | "SAVE_FAILED" | "VALIDATION_FAILED" | null;
  fieldErrors?: Partial<Record<EmployeeProfileField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialEmployeeProfileActionState: EmployeeProfileActionState = {
  code: null,
  status: "idle",
};

export type WeeklyAvailabilityField = "employeeId" | "locale" | "weekday";

export type WeeklyAvailabilityActionState = Readonly<{
  code: "AUTH_FAILED" | "SAVED" | "SAVE_FAILED" | "VALIDATION_FAILED" | null;
  fieldErrors?: Partial<Record<WeeklyAvailabilityField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialWeeklyAvailabilityActionState: WeeklyAvailabilityActionState =
  {
    code: null,
    status: "idle",
  };

const LocaleInputSchema = z.enum(["de", "en"]);
const UuidSchema = z.string().uuid();

export const EmployeeProfileFormDataKeys = [
  "employeeId",
  "fullName",
  "locale",
] as const;

export const UpdateEmployeeProfileInputSchema = z
  .object({
    employeeId: UuidSchema,
    fullName: z.string().trim().min(1).max(120),
    locale: LocaleInputSchema,
  })
  .strict();

export type UpdateEmployeeProfileCommandDto = z.infer<
  typeof UpdateEmployeeProfileInputSchema
>;

export function employeeProfileFieldErrors(
  error: z.ZodError,
): Partial<Record<EmployeeProfileField, "invalid">> {
  const fieldErrors: Partial<Record<EmployeeProfileField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as EmployeeProfileField] = "invalid";
    }
  });

  return fieldErrors;
}

export const WeeklyAvailabilityFormDataKeys = [
  "employeeId",
  "locale",
  "weekday",
  "isAvailable",
] as const;

const WeekdaySchema = z.coerce.number().int().min(0).max(6);

export const SetWeeklyAvailabilityInputSchema = z
  .object({
    employeeId: UuidSchema,
    isAvailable: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    locale: LocaleInputSchema,
    weekday: WeekdaySchema,
  })
  .strict();

export type SetWeeklyAvailabilityCommandDto = z.infer<
  typeof SetWeeklyAvailabilityInputSchema
>;

export function weeklyAvailabilityFieldErrors(
  error: z.ZodError,
): Partial<Record<WeeklyAvailabilityField, "invalid">> {
  const fieldErrors: Partial<Record<WeeklyAvailabilityField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as WeeklyAvailabilityField] = "invalid";
    }
  });

  return fieldErrors;
}

// ── Default daily hours ──────────────────────────────────────────────────────

export type DefaultDailyHoursActionState = Readonly<{
  code: "AUTH_FAILED" | "SAVED" | "SAVE_FAILED" | "VALIDATION_FAILED" | null;
  fieldErrors?: Partial<Record<DefaultDailyHoursField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialDefaultDailyHoursActionState: DefaultDailyHoursActionState =
  {
    code: null,
    status: "idle",
  };

export const DefaultDailyHoursFormDataKeys = [
  "employeeId",
  "locale",
  "defaultDailyHours",
] as const;

export const SetDefaultDailyHoursInputSchema = z
  .object({
    defaultDailyHours: z.coerce
      .number()
      .min(0.5)
      .max(24)
      .multipleOf(0.5)
      .nullable()
      .optional()
      .transform((v) => (v === 0 || v === undefined ? null : v)),
    employeeId: z.string().uuid(),
    locale: z.enum(["de", "en"]),
  })
  .strict();

export type SetDefaultDailyHoursCommandDto = z.infer<
  typeof SetDefaultDailyHoursInputSchema
>;

export function defaultDailyHoursFieldErrors(
  error: z.ZodError,
): Partial<Record<DefaultDailyHoursField, "invalid">> {
  const fieldErrors: Partial<Record<DefaultDailyHoursField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as DefaultDailyHoursField] = "invalid";
    }
  });

  return fieldErrors;
}
