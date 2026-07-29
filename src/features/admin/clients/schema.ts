import { z } from "zod";

export type ClientContactInfo = Readonly<{
  contactName?: string;
  email?: string;
  notes?: string;
  phone?: string;
}>;

export type ClientFormField =
  | "address"
  | "contactEmail"
  | "contactName"
  | "contactNotes"
  | "contactPhone"
  | "id"
  | "locale"
  | "name"
  | "nextIsActive";

export type ClientActionState = Readonly<{
  code:
    | "AUTH_FAILED"
    | "CLIENT_CREATED"
    | "CLIENT_UPDATED"
    | "STATUS_UPDATED"
    | "SAVE_FAILED"
    | "VALIDATION_FAILED"
    | null;
  fieldErrors?: Partial<Record<ClientFormField, "invalid">>;
  status: "error" | "idle" | "success";
}>;

export const initialClientActionState: ClientActionState = {
  code: null,
  status: "idle",
};

const LocaleInputSchema = z.enum(["de", "en"]);
const ClientIdSchema = z.string().uuid();

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function optionalText(maxLength: number) {
  return z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(maxLength).optional(),
  );
}

const OptionalEmailSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().email().max(254).optional(),
);

export const ClientFormDataKeys = [
  "address",
  "contactEmail",
  "contactName",
  "contactNotes",
  "contactPhone",
  "locale",
  "name",
] as const;

const ClientBaseInputSchema = z
  .object({
    address: z.string().trim().max(500),
    contactEmail: OptionalEmailSchema,
    contactName: optionalText(160),
    contactNotes: optionalText(500),
    contactPhone: optionalText(80),
    locale: LocaleInputSchema,
    name: z.string().trim().min(1).max(120),
  })
  .strict();

export const CreateClientInputSchema = ClientBaseInputSchema;

export const UpdateClientInputSchema = ClientBaseInputSchema.extend({
  id: ClientIdSchema,
}).strict();

export const SetClientActiveInputSchema = z
  .object({
    id: ClientIdSchema,
    locale: LocaleInputSchema,
    nextIsActive: z
      .enum(["false", "true"])
      .transform((value) => value === "true"),
  })
  .strict();

export type CreateClientCommandDto = z.infer<typeof CreateClientInputSchema>;
export type UpdateClientCommandDto = z.infer<typeof UpdateClientInputSchema>;
export type SetClientActiveCommandDto = z.infer<
  typeof SetClientActiveInputSchema
>;

export function clientFieldErrors(
  error: z.ZodError,
): Partial<Record<ClientFormField, "invalid">> {
  const fieldErrors: Partial<Record<ClientFormField, "invalid">> = {};

  error.issues.forEach((issue) => {
    const [field] = issue.path;

    if (typeof field === "string") {
      fieldErrors[field as ClientFormField] = "invalid";
    }
  });

  return fieldErrors;
}

export function buildClientContactInfo(
  dto: CreateClientCommandDto | UpdateClientCommandDto,
): ClientContactInfo {
  return {
    ...(dto.contactName ? { contactName: dto.contactName } : {}),
    ...(dto.contactEmail ? { email: dto.contactEmail } : {}),
    ...(dto.contactPhone ? { phone: dto.contactPhone } : {}),
    ...(dto.contactNotes ? { notes: dto.contactNotes } : {}),
  };
}

function readContactString(
  record: Record<string, unknown>,
  key: keyof ClientContactInfo,
  maxLength: number,
) {
  const value = record[key];

  return typeof value === "string" && value.length <= maxLength
    ? value
    : undefined;
}

export function parseClientContactInfo(value: unknown): ClientContactInfo {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    ...(readContactString(record, "contactName", 160)
      ? { contactName: readContactString(record, "contactName", 160) }
      : {}),
    ...(readContactString(record, "email", 254)
      ? { email: readContactString(record, "email", 254) }
      : {}),
    ...(readContactString(record, "phone", 80)
      ? { phone: readContactString(record, "phone", 80) }
      : {}),
    ...(readContactString(record, "notes", 500)
      ? { notes: readContactString(record, "notes", 500) }
      : {}),
  };
}
