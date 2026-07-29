import { z } from "zod";

export type StaffAssignmentField =
  "clientId" | "employeeId" | "endDate" | "id" | "locale" | "startDate";

export type StaffAssignmentActionState = Readonly<{
  code:
    | "AUTH_FAILED"
    | "ENDED"
    | "SAVED"
    | "SAVE_FAILED"
    | "VALIDATION_FAILED"
    | null;
  fieldErrors?: Partial<Record<StaffAssignmentField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialStaffAssignmentActionState: StaffAssignmentActionState = {
  code: null,
  status: "idle",
};

const LocaleInputSchema = z.enum(["de", "en"]);
const UuidSchema = z.string().uuid();

function emptyStringToNull(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return null;
  }

  return value;
}

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });

const NullableIsoDateSchema = z.preprocess(
  emptyStringToNull,
  IsoDateSchema.nullable(),
);

export const StaffAssignmentFormDataKeys = [
  "clientId",
  "employeeId",
  "endDate",
  "locale",
  "startDate",
] as const;

const StaffAssignmentBaseInputSchema = z
  .object({
    clientId: UuidSchema,
    employeeId: UuidSchema,
    endDate: NullableIsoDateSchema,
    locale: LocaleInputSchema,
    startDate: IsoDateSchema,
  })
  .strict()
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    path: ["endDate"],
  });

export const CreateStaffAssignmentInputSchema = StaffAssignmentBaseInputSchema;

export const UpdateStaffAssignmentInputSchema =
  StaffAssignmentBaseInputSchema.extend({
    id: UuidSchema,
  }).strict();

export const EndStaffAssignmentInputSchema = z
  .object({
    id: UuidSchema,
    locale: LocaleInputSchema,
  })
  .strict();

export type CreateStaffAssignmentCommandDto = z.infer<
  typeof CreateStaffAssignmentInputSchema
>;
export type UpdateStaffAssignmentCommandDto = z.infer<
  typeof UpdateStaffAssignmentInputSchema
>;
export type EndStaffAssignmentCommandDto = z.infer<
  typeof EndStaffAssignmentInputSchema
>;

export function staffAssignmentFieldErrors(
  error: z.ZodError,
): Partial<Record<StaffAssignmentField, "invalid">> {
  const fieldErrors: Partial<Record<StaffAssignmentField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as StaffAssignmentField] = "invalid";
    }
  });

  return fieldErrors;
}
