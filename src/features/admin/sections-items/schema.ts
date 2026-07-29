import { z } from "zod";

export type ItemTag = "complaint" | "high_priority" | "normal";
export type EntityKind = "leafItem" | "section";

export type SectionsItemsField =
  | "clientId"
  | "entityId"
  | "entityKind"
  | "estimatedMinutes"
  | "id"
  | "locale"
  | "name"
  | "parentSectionId"
  | "quantity"
  | "recurrenceDays"
  | "referenceImage"
  | "sectionId"
  | "sortOrder"
  | "tag";

export type SectionsItemsActionState = Readonly<{
  code:
    | "AUTH_FAILED"
    | "DELETED"
    | "IMAGE_ATTACHED"
    | "SAVED"
    | "SAVE_FAILED"
    | "VALIDATION_FAILED"
    | null;
  fieldErrors?: Partial<Record<SectionsItemsField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialSectionsItemsActionState: SectionsItemsActionState = {
  code: null,
  status: "idle",
};

const LocaleInputSchema = z.enum(["de", "en"]);
const UuidSchema = z.string().uuid();

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

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

function integerFromForm(min: number, max: number) {
  return z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(min).max(max),
  );
}

const OptionalPositiveIntegerSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().min(1).max(3650).optional(),
);

const ParentSectionInputSchema = z.preprocess(
  emptyStringToNull,
  UuidSchema.nullable(),
);

export const SectionFormDataKeys = [
  "clientId",
  "locale",
  "name",
  "parentSectionId",
  "sortOrder",
] as const;

export const LeafItemFormDataKeys = [
  "clientId",
  "estimatedMinutes",
  "locale",
  "name",
  "quantity",
  "recurrenceDays",
  "sectionId",
  "tag",
] as const;

const SectionBaseInputSchema = z
  .object({
    clientId: UuidSchema,
    locale: LocaleInputSchema,
    name: z.string().trim().min(1).max(160),
    parentSectionId: ParentSectionInputSchema,
    sortOrder: integerFromForm(0, 999_999),
  })
  .strict();

const LeafItemBaseInputSchema = z
  .object({
    clientId: UuidSchema,
    estimatedMinutes: integerFromForm(1, 1440),
    locale: LocaleInputSchema,
    name: z.string().trim().min(1).max(160),
    quantity: integerFromForm(1, 999),
    recurrenceDays: OptionalPositiveIntegerSchema,
    sectionId: UuidSchema,
    tag: z.enum(["normal", "complaint", "high_priority"]),
  })
  .strict();

export const CreateSectionInputSchema = SectionBaseInputSchema;

export const UpdateSectionInputSchema = SectionBaseInputSchema.extend({
  id: UuidSchema,
}).strict();

export const DeleteSectionInputSchema = z
  .object({
    clientId: UuidSchema,
    id: UuidSchema,
    locale: LocaleInputSchema,
  })
  .strict();

export const CreateLeafItemInputSchema = LeafItemBaseInputSchema;

export const UpdateLeafItemInputSchema = LeafItemBaseInputSchema.extend({
  id: UuidSchema,
}).strict();

export const DeleteLeafItemInputSchema = z
  .object({
    clientId: UuidSchema,
    id: UuidSchema,
    locale: LocaleInputSchema,
  })
  .strict();

export const AttachReferenceImageInputSchema = z
  .object({
    clientId: UuidSchema,
    entityId: UuidSchema,
    entityKind: z.enum(["leafItem", "section"]),
    locale: LocaleInputSchema,
  })
  .strict();

export type CreateSectionCommandDto = z.infer<typeof CreateSectionInputSchema>;
export type UpdateSectionCommandDto = z.infer<typeof UpdateSectionInputSchema>;
export type DeleteSectionCommandDto = z.infer<typeof DeleteSectionInputSchema>;
export type CreateLeafItemCommandDto = z.infer<
  typeof CreateLeafItemInputSchema
>;
export type UpdateLeafItemCommandDto = z.infer<
  typeof UpdateLeafItemInputSchema
>;
export type DeleteLeafItemCommandDto = z.infer<
  typeof DeleteLeafItemInputSchema
>;
export type AttachReferenceImageCommandDto = z.infer<
  typeof AttachReferenceImageInputSchema
>;

export function sectionsItemsFieldErrors(
  error: z.ZodError,
): Partial<Record<SectionsItemsField, "invalid">> {
  const fieldErrors: Partial<Record<SectionsItemsField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as SectionsItemsField] = "invalid";
    }
  });

  return fieldErrors;
}
