# John Reed Fitness Seed Data Strategy

Date: 2026-07-28

## Purpose

NobleClean-Ops launches with John Reed Fitness as the first real client, but the application must remain a generic multi-tenant operations tool. John Reed data may exist only as optional seed/demo data used by local development, staging, and RLS tests. It must never create client-specific branches, constants, route behavior, permissions, UI copy, or feature logic.

## Hard Rule

The app must behave the same for John Reed Fitness as it does for any other client created by an admin. If removing all seed files would break any runtime behavior, the implementation is wrong.

## Allowed Seed Content

Seed data may include generic operational structure needed to exercise the MVP domain model:

- One `clients` row named `John Reed Fitness` with non-sensitive placeholder address/contact values unless management explicitly approves real business contact details.
- A realistic section tree for a fitness facility, such as entrance, cardio, weight area, studios, locker rooms, sanitary areas, staff/service areas, and circulation paths.
- Leaf items with generic names, quantities, estimated total minutes, recurrence intervals, and priority tags.
- Optional synthetic work schedules, employee-client assignments, daily plans, and completed plan items for testing reporting and last-cleaned behavior.
- Optional reference image placeholders or generated demo images that contain no people, no faces, no license plates, no membership details, no building access details, and no private operational information.

Seed data must not include:

- Real employee names, emails, phone numbers, addresses, schedules, credentials, payroll data, or HR data.
- Real John Reed staff/member data, private contacts, complaints, incident details, contract terms, pricing, keys, access codes, alarm instructions, Wi-Fi credentials, or internal facility notes.
- Real production Supabase Auth users unless loaded through a controlled staging-only process with approved test accounts.
- Public URLs or storage paths that expose private reference images.
- Any hardcoded UUIDs referenced by application code.

## Storage Location

Seed data should live outside application runtime logic:

- `supabase/seed/` or equivalent seed-tooling directory for SQL/JSON fixtures.
- `supabase/tests/fixtures/` or equivalent test fixture directory for RLS-only datasets.
- `_handoff/` may document seed strategy, but should not become the executable seed source.

Recommended split:

- `baseline_demo.seed.*`: optional local/staging demo client data.
- `rls_test.seed.*`: deterministic synthetic data for authorization tests.
- `reset_dev.*`: local-only reset helper that clearly refuses production targets.

The seed loader must be environment-gated. It may run only against local Supabase or explicitly approved staging projects. It must reject production-like project refs, production database URLs, and missing environment markers.

## Generic Modeling Rules

John Reed must be represented only through normal rows in normal tables:

- `clients.name = "John Reed Fitness"` is data, not logic.
- Section and item hierarchy uses the same `sections` and `leaf_items` schema as every future client.
- Scheduling uses `work_schedule`.
- Employee assignment uses `employee_client_assignments`.
- Completion history uses `daily_plans` and `daily_plan_items`.

No code may use conditions like `if client.name === "John Reed Fitness"` or constants such as `JOHN_REED_CLIENT_ID` outside seed/test fixtures. Tests may refer to deterministic fixture IDs only inside isolated fixture setup and expected assertions.

## Safe Load And Reset

Seed/reset tooling must be explicit, reversible in dev, and hostile to accidents:

- Require an environment marker such as `SEED_TARGET=local` or `SEED_TARGET=staging`.
- Require a separate confirmation flag for destructive reset commands.
- Never read `.env` or secrets in agent workflows; humans may provide local/staging env configuration through approved tooling.
- Truncate or delete seed-created rows only by a seed namespace/marker where possible, not by broad table wipes in shared databases.
- Keep seed object names/path prefixes clearly identifiable, for example `seed/john-reed-demo/...`.
- Never write seed assets to public buckets.
- Never use Supabase service keys in browser-side seed helpers.
- Do not run seed/reset tooling against production.

Seed-generated records should include a non-runtime marker where the schema permits it. If the core schema should not contain seed metadata, keep an external manifest mapping fixture names to IDs in the seed tooling directory. Do not add product-visible seed flags solely for developer convenience unless a Beads issue explicitly approves the schema impact.

## RLS Test Interaction

RLS tests should use synthetic fixtures that resemble the John Reed launch shape but do not depend on the demo client being present.

Minimum authorization scenarios:

- Admin can read and write all seeded client, section, item, schedule, plan, and storage records.
- Employee assigned to seed client A can read only client A operational data.
- Employee assigned to seed client A cannot read client B data.
- Employee cannot read other employees' schedules, plans, or completion history.
- Inactive or expired assignments deny employee access.
- Employee write paths are limited to their own daily plan and daily plan items for their active assigned client.
- Cross-client section/item insertion attempts fail.
- Storage access denies traversal, public access, and cross-client object reads.
- Last-cleaned aggregate access does not expose raw completion history from other employees.

Test fixtures may use deterministic UUIDs to make assertions stable, but those IDs must remain inside fixture/test files and must never be imported by application modules.

## Production Posture

Production launch data should be created through the admin UI or a reviewed, one-time import process, not through development seed scripts. If management wants real John Reed production data preloaded, create a separate Beads issue for a reviewed import plan covering source data approval, PII minimization, RLS verification, backup/restore readiness, and rollback.

## Acceptance Gate For Future Implementation

Future agents may close seed implementation work only when:

- Seed scripts are separate from runtime app logic.
- Production safeguards are present and tested.
- No real PII, secrets, credentials, access details, or private images are included.
- RLS tests prove multi-tenant isolation using at least two clients and multiple employees.
- Removing seed files does not change runtime behavior.
