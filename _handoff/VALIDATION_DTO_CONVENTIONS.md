# NobleClean-Ops Validation and DTO Conventions

Date: 2026-07-28
Owner: Validation and DTO Security Architect
Beads issue: nobleclean-aw4.1

## Purpose

This document defines the mandatory server-side input validation and DTO conventions for NobleClean-Ops before application code exists. It applies to every future Next.js App Router form, Route Handler, Server Action, Supabase query, Supabase mutation, and file-upload path.

The rule is simple: raw request data never reaches authorization checks, business logic, or database writes. Every write path must transform untrusted input into an explicit, validated, allowlisted command DTO first.

## Scope

These conventions apply to:

- Form submissions from admin and employee screens.
- Server Actions.
- Route Handlers under `app/**/route.ts`.
- URL params, search params, headers, cookies, and request bodies.
- Supabase `insert`, `update`, `upsert`, RPC calls, and Storage uploads.
- File metadata and reference-image uploads.

These conventions do not implement feature schemas yet. Feature schemas must be created only when their matching Beads issue is selected.

## Canonical Pattern

Every state-changing operation must use this pipeline:

```text
untrusted request input
  -> parse only expected fields
  -> validate runtime schema
  -> normalize safe values
  -> produce command DTO
  -> authenticate user
  -> authorize function and object scope
  -> construct explicit DB mutation object
  -> execute mutation through Supabase with RLS
  -> return sanitized response DTO
```

No step may be skipped because TypeScript types, React form constraints, hidden inputs, or client-side validation are not security boundaries.

## Validation Library Decision

Use `zod` for runtime validation unless a future architecture issue explicitly replaces it.

Reasons:

- Strong TypeScript inference from runtime schemas.
- Mature ecosystem for Next.js Server Actions and Route Handlers.
- Clear allowlist behavior through strict object schemas.
- Good support for transforms, refinements, discriminated unions, enums, and safe parse results.

All schemas that accept objects must use strict allowlist behavior:

```ts
z.object({
  name: z.string().trim().min(1).max(120),
}).strict()
```

Unknown fields must be rejected, not ignored silently, for state-changing write input. If a read/search endpoint needs tolerant query parsing, that exception must be documented in the local schema file and must not be reused for writes.

## Planned File Organization

When the Next.js scaffold exists, create the validation layer before implementing feature write paths:

```text
src/
  lib/
    validation/
      result.ts              # typed success/failure result helpers
      primitives.ts          # uuid, date, locale, pagination, text, minutes
      form-data.ts           # explicit FormData extraction helpers
      errors.ts              # generic user-safe validation errors
    dto/
      README.md              # DTO rules and examples
      admin/
      employee/
    server/
      auth/
      authz/
      db/
```

Feature-specific schemas live near the feature boundary, but shared primitives must be reused. Avoid one giant global schema file.

## Naming Conventions

Use names that show the trust boundary:

- `InputSchema`: validates raw external input.
- `CommandDto`: safe, normalized server command after validation.
- `DbInsert` / `DbUpdate`: explicit object sent to Supabase.
- `ResponseDto`: sanitized data returned to the client.

Examples:

- `CreateClientInputSchema`
- `CreateClientCommandDto`
- `ClientDbInsert`
- `ClientSummaryResponseDto`
- `SubmitDailyPlanInputSchema`
- `SubmitDailyPlanCommandDto`

Never name a raw request object `client`, `profile`, `leafItem`, or any table-like name. That blurs the boundary and encourages mass assignment.

## Required Primitive Schemas

Shared primitives must be defined once and reused:

- `uuidSchema`: strict UUID for every route param and foreign key candidate.
- `shortTextSchema`: trimmed text with minimum and maximum length.
- `longTextSchema`: bounded multiline text for contact details or notes.
- `positiveMinutesSchema`: integer minutes with a sane upper bound.
- `quantitySchema`: integer quantity with a sane upper bound.
- `isoDateSchema`: date-only string for `work_date`, `start_date`, `end_date`.
- `localeSchema`: enum of `de` and `en`.
- `roleSchema`: enum of `admin` and `employee`.
- `priorityTagSchema`: enum of `normal`, `complaint`, and `high_priority`.
- `fileExtensionSchema`: image extension allowlist only.
- `contentTypeSchema`: image MIME allowlist only.

Open product decisions must not be encoded prematurely. For example, `estimated_minutes` with `quantity > 1` is currently assumed to mean total combined minutes, but the schema must not bake in per-unit multiplication unless the product decision is closed.

## FormData Rules

Server Actions receiving `FormData` must not call `Object.fromEntries(formData)` and pass the result onward.

Instead, use a helper that extracts only declared keys:

```ts
const raw = pickFormData(formData, [
  "name",
  "address",
  "contactInfo",
]);

const dto = CreateClientInputSchema.parse(raw);
```

The helper must:

- Return only requested keys.
- Reject duplicate scalar keys unless the schema explicitly supports arrays.
- Reject `File` values unless the schema explicitly expects file input.
- Preserve empty values so the schema decides whether they are valid.

## Route Handler Rules

Route Handlers must validate every input source independently:

- `params`: validate UUIDs and route enums.
- `searchParams`: validate filters, pagination, sort fields, and dates.
- `request.json()`: validate body schema before any use.
- `request.formData()`: use the FormData rules above.
- `headers`: read only allowlisted headers; never trust forwarded host/origin values for authorization.
- `cookies`: use only through approved Supabase/session helpers.

State-changing Route Handlers must verify method, authentication, authorization, CSRF/origin policy when cookie-authenticated, request size, and rate-limit expectations.

## Server Action Rules

Server Actions are network-exposed mutation endpoints. Every Server Action must:

- Validate arguments at runtime.
- Authenticate the user inside the action.
- Authorize the role and object scope inside the action.
- Avoid binding sensitive values with `.bind`.
- Avoid accepting role, employee ID, client ID, or owner fields from the client unless the action specifically authorizes that relationship.
- Return generic validation/auth errors suitable for UI display.

Client-side disabled buttons, hidden fields, and role-gated UI are UX only and are never authorization.

## Supabase Mutation Rules

Never do this:

```ts
await supabase.from("clients").insert(dto);
await supabase.from("clients").update(dto).eq("id", id);
```

Always construct a table-specific object explicitly:

```ts
const insert: ClientDbInsert = {
  name: dto.name,
  address: dto.address,
  contact_info: dto.contactInfo,
  is_active: true,
};

await supabase.from("clients").insert(insert);
```

Server-owned fields must be assigned server-side only:

- `id`
- `created_at`
- `updated_at`
- `submitted_at`
- `completed_at`
- authenticated user IDs
- role fields
- assignment ownership fields
- status transitions not chosen directly by the client

Generated Supabase database types are allowed for mutation object typing, but they must not be used as external request DTOs.

## Authorization Coupling

Validation proves shape. Authorization proves permission. Both are mandatory.

Every write must have:

- Function-level authorization to prevent BFLA.
- Object-level authorization to prevent BOLA, IDOR, and cross-client data access.
- RLS policy coverage as the database-level backstop.

Examples:

- Creating a client: admin-only function check.
- Updating a section: admin-only function check plus section belongs to target client.
- Creating a daily plan: employee can create only for self, assigned client, scheduled date.
- Updating daily plan items: employee can update only own active/submitted plan items for assigned client scope.
- Uploading reference images: admin-only for sections and leaf items unless a later approved issue expands this.

Do not rely on client-provided `role`, `employee_id`, or `client_id` alone. Derive identity from the authenticated session and verify relationships against the database.

## DTO Boundaries By Feature Area

Admin DTOs:

- May accept editable business fields only.
- Must never accept `role`, `created_at`, `updated_at`, audit timestamps, or arbitrary foreign keys without validating admin permission and object relationship.
- Must validate tree operations so `parent_section_id` belongs to the same `client_id` and cannot create cycles.

Employee DTOs:

- Must derive `employee_id` from session, not form input.
- Must verify active assignment before reading or writing client-scoped data.
- Must verify work schedule before creating a daily plan.
- Must allow selecting any leaf item visually, but only if the item belongs to the assigned client.

Reporting DTOs:

- Must validate date ranges and pagination bounds.
- Must not expose other employees' history to employee role.
- Must return response DTOs, not raw joined rows with unnecessary columns.

File upload DTOs:

- Must separate metadata DTOs from binary file validation.
- Must validate extension, declared MIME type, magic bytes, size, and image dimensions when practical.
- Must generate random storage object names server-side.
- Must never use user-provided filenames as storage paths.

## Response DTO Rules

Responses must be allowlisted too.

Do not return raw Supabase rows directly to client components if the row includes fields unnecessary for that screen. Map rows to response DTOs that include only what the UI needs.

Employee responses must be especially narrow:

- No other employee profiles.
- No unrelated schedules.
- No cross-client assignment history.
- No admin-only metadata.

## Error Handling

Validation failures should return generic, structured errors:

```ts
{
  ok: false,
  code: "VALIDATION_FAILED",
  fieldErrors: {
    name: "invalid"
  }
}
```

Do not return stack traces, SQL errors, table names, policy names, filesystem paths, storage paths, or raw exception messages to users.

Internal logs, once added, must redact PII, cookies, authorization headers, tokens, and request bodies that may contain sensitive fields.

## i18n Boundary

Validation code returns stable error codes, not user-facing text. UI layers translate those codes through German and English locale files only.

No Arabic UI strings and no hardcoded validation messages in application components.

## Review Checklist For Future Agents

Before closing any issue that adds a write path, verify:

- The Beads issue was claimed before coding.
- `_handoff/SECURITY_RULES.md` was read.
- No raw request object is passed into business logic or Supabase.
- Runtime schema validation exists for every input source.
- Schemas are strict allowlists for writes.
- DTOs do not include server-owned fields.
- Database mutation objects are manually constructed.
- Authn and authz checks happen server-side.
- Object scope checks prevent cross-client and cross-user access.
- RLS tests or policy verification are included when database policies exist.
- User-facing errors are generic and localizable.
- File uploads, if touched, validate content and do not trust filenames.

## Acceptance Standard

For NobleClean-Ops, a write path is acceptable only when an independent reviewer can trace:

1. Where untrusted input enters.
2. Which schema validates it.
3. Which DTO is produced.
4. Which authn/authz checks run.
5. Which explicit DB mutation object is constructed.
6. Which RLS policy backs it up.
7. Which response DTO is returned.

If any link in that chain is missing, the write path must be rejected.
