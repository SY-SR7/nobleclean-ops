import { z } from "zod";

export type MyDaySelectionField =
  | "clientId"
  | "completeAll"
  | "completedLeafItemIds"
  | "completedToolStepIds"
  | "leafItemIds"
  | "locale"
  | "workDate";

export type MyDaySelectionActionState = Readonly<{
  code:
    | "AUTH_FAILED"
    | "COMPLETED"
    | "SAVED"
    | "SAVE_FAILED"
    | "TOO_SHORT"
    | "VALIDATION_FAILED"
    | null;
  fieldErrors?: Partial<Record<MyDaySelectionField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialMyDaySelectionActionState: MyDaySelectionActionState = {
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

const LeafItemIdsSchema = z
  .array(UuidSchema)
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length);

const CompletedLeafItemIdsSchema = z
  .array(UuidSchema)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length);

const CompletedToolStepIdsSchema = z
  .array(UuidSchema)
  .max(2000)
  .refine((ids) => new Set(ids).size === ids.length);

export const SaveMyDaySelectionInputSchema = z
  .object({
    clientId: UuidSchema,
    leafItemIds: LeafItemIdsSchema,
    locale: LocaleInputSchema,
    workDate: IsoDateSchema,
  })
  .strict();

export const SubmitMyDayCompletionInputSchema = z
  .object({
    clientId: UuidSchema,
    completeAll: z.boolean(),
    completedLeafItemIds: CompletedLeafItemIdsSchema,
    completedToolStepIds: CompletedToolStepIdsSchema,
    locale: LocaleInputSchema,
    workDate: IsoDateSchema,
  })
  .strict();

export type SaveMyDaySelectionCommandDto = z.infer<
  typeof SaveMyDaySelectionInputSchema
>;

export type SubmitMyDayCompletionCommandDto = z.infer<
  typeof SubmitMyDayCompletionInputSchema
>;

export function myDaySelectionFieldErrors(
  error: z.ZodError,
): Partial<Record<MyDaySelectionField, "invalid">> {
  const fieldErrors: Partial<Record<MyDaySelectionField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as MyDaySelectionField] = "invalid";
    }
  });

  return fieldErrors;
}
