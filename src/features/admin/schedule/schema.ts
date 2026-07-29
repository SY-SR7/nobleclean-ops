import { z } from "zod";

export type ScheduleField =
  "allocatedHours" | "clientId" | "employeeId" | "id" | "locale" | "workDate";

export type ScheduleActionState = Readonly<{
  code:
    | "AUTH_FAILED"
    | "DELETED"
    | "SAVED"
    | "SAVE_FAILED"
    | "VALIDATION_FAILED"
    | null;
  fieldErrors?: Partial<Record<ScheduleField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialScheduleActionState: ScheduleActionState = {
  code: null,
  status: "idle",
};

const LocaleInputSchema = z.enum(["de", "en"]);
const UuidSchema = z.string().uuid();
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });

const AllocatedHoursSchema = z.coerce
  .number()
  .min(0.25)
  .max(24)
  .refine((value) => Number.isFinite(value))
  .transform((value) => Math.round(value * 100) / 100);

export const ScheduleFormDataKeys = [
  "allocatedHours",
  "clientId",
  "employeeId",
  "locale",
  "workDate",
] as const;

const ScheduleBaseInputSchema = z
  .object({
    allocatedHours: AllocatedHoursSchema,
    clientId: UuidSchema,
    employeeId: UuidSchema,
    locale: LocaleInputSchema,
    workDate: IsoDateSchema,
  })
  .strict();

export const CreateScheduleInputSchema = ScheduleBaseInputSchema;

export const UpdateScheduleInputSchema = ScheduleBaseInputSchema.extend({
  id: UuidSchema,
}).strict();

export const DeleteScheduleInputSchema = z
  .object({
    id: UuidSchema,
    locale: LocaleInputSchema,
  })
  .strict();

export type CreateScheduleCommandDto = z.infer<
  typeof CreateScheduleInputSchema
>;
export type UpdateScheduleCommandDto = z.infer<
  typeof UpdateScheduleInputSchema
>;
export type DeleteScheduleCommandDto = z.infer<
  typeof DeleteScheduleInputSchema
>;

export function scheduleFieldErrors(
  error: z.ZodError,
): Partial<Record<ScheduleField, "invalid">> {
  const fieldErrors: Partial<Record<ScheduleField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as ScheduleField] = "invalid";
    }
  });

  return fieldErrors;
}
