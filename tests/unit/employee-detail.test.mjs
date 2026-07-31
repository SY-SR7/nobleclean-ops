import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function readProjectFile(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("admin employee detail route and feature files exist", () => {
  [
    "src/app/[locale]/admin/staff/[employeeId]/page.tsx",
    "src/features/admin/staff/employee-detail/actions.ts",
    "src/features/admin/staff/employee-detail/queries.ts",
    "src/features/admin/staff/employee-detail/schema.ts",
    "src/features/admin/staff/employee-detail/EmployeeDetailInteractive.tsx",
    "supabase/migrations/20260730010000_employee_weekly_availability.sql",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("employee weekly availability migration defines a real, RLS-scoped table", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260730010000_employee_weekly_availability.sql",
  );

  assert.match(migration, /create table if not exists public\.employee_weekly_availability/);
  assert.match(migration, /weekday smallint not null/);
  assert.match(migration, /check \(weekday >= 0 and weekday <= 6\)/);
  assert.match(migration, /unique \(employee_id, weekday\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /current_user_is_admin\(\)/);
  assert.match(migration, /current_user_is_employee\(\)/);
  assert.doesNotMatch(migration, /service_role|SERVICE_ROLE/);
});

test("employee profile and availability mutations enforce DTO, admin role, and origin checks", () => {
  const actions = readProjectFile(
    "src/features/admin/staff/employee-detail/actions.ts",
  );
  const schema = readProjectFile(
    "src/features/admin/staff/employee-detail/schema.ts",
  );

  assert.match(actions, /pickFormData/);
  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(locale,\s*"admin"\)/);
  assert.match(actions, /UpdateEmployeeProfileInputSchema\.safeParse/);
  assert.match(actions, /SetWeeklyAvailabilityInputSchema\.safeParse/);
  assert.match(actions, /employeeExists/);
  assert.doesNotMatch(actions, /\.update\(dto\)/);
  assert.doesNotMatch(actions, /\.upsert\(dto\)/);
  assert.doesNotMatch(actions, /service_role|SERVICE_ROLE|admin\.createUser/);
  assert.match(schema, /\.strict\(\)/);
});

test("employee detail reads are scoped through admin authorization and reuse real tables", () => {
  const queries = readProjectFile(
    "src/features/admin/staff/employee-detail/queries.ts",
  );

  assert.match(queries, /requireRole\(locale,\s*"admin"\)/);
  assert.match(queries, /employee_weekly_availability/);
  assert.match(queries, /employee_client_assignments/);
  assert.match(queries, /daily_plans/);
  assert.doesNotMatch(queries, /getDeterministicAvailability/);
});

test("staff list links every employee to their own detail page", () => {
  const staffInteractive = readProjectFile(
    "src/features/admin/staff/StaffInteractive.tsx",
  );

  assert.match(staffInteractive, /admin\/staff\/\$\{empId\}/);
});

test("employee detail UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "title",
    "backToStaff",
    "profileTitle",
    "fields",
    "roleValues",
    "actions",
    "feedback",
    "availabilityTitle",
    "weekdays",
    "availabilityStatus",
    "assignmentHistoryTitle",
    "recentPlansTitle",
    "planStatus",
  ].forEach((key) => {
    assert.ok(
      de.staff.employeeDetail[key],
      `de staff.employeeDetail.${key} missing`,
    );
    assert.ok(
      en.staff.employeeDetail[key],
      `en staff.employeeDetail.${key} missing`,
    );
  });

  assert.ok(de.staff.viewDetails, "de staff.viewDetails missing");
  assert.ok(en.staff.viewDetails, "en staff.viewDetails missing");
});
