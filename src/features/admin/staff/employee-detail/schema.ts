import { z } from "zod";

export type EmployeeProfileField = "employeeId" | "fullName" | "locale";

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
