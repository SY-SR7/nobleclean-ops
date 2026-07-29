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

test("admin staff assignment route and feature files exist", () => {
  [
    "src/app/[locale]/admin/staff/page.tsx",
    "src/features/admin/staff/actions.ts",
    "src/features/admin/staff/queries.ts",
    "src/features/admin/staff/schema.ts",
    "src/features/admin/staff/StaffAssignmentForms.tsx",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("staff assignment mutations enforce DTO, admin role, origin, and overlap checks", () => {
  const actions = readProjectFile("src/features/admin/staff/actions.ts");
  const schema = readProjectFile("src/features/admin/staff/schema.ts");

  assert.match(actions, /pickFormData/);
  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(locale,\s*"admin"\)/);
  assert.match(actions, /CreateStaffAssignmentInputSchema\.safeParse/);
  assert.match(actions, /UpdateStaffAssignmentInputSchema\.safeParse/);
  assert.match(actions, /hasOverlappingAssignment/);
  assert.match(actions, /employeeExists/);
  assert.match(actions, /clientExists/);
  assert.match(actions, /const insert:\s*AssignmentDbInsert\s*=/);
  assert.match(actions, /const update:\s*AssignmentDbUpdate\s*=/);
  assert.doesNotMatch(actions, /\.insert\(dto\)/);
  assert.doesNotMatch(actions, /\.update\(dto\)/);
  assert.doesNotMatch(actions, /service_role|SERVICE_ROLE|admin\.createUser/);
  assert.match(schema, /\.strict\(\)/);
});

test("staff assignment reads are scoped through admin authorization", () => {
  const queries = readProjectFile("src/features/admin/staff/queries.ts");
  const page = readProjectFile("src/app/[locale]/admin/staff/page.tsx");

  assert.match(queries, /requireRole\(locale,\s*"admin"\)/);
  assert.match(queries, /employee_client_assignments/);
  assert.match(page, /StaffAssignmentForm/);
  assert.match(page, /EndAssignmentForm/);
});

test("staff assignment UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "assignTitle",
    "updateTitle",
    "assignmentsTitle",
    "fields",
    "actions",
    "status",
    "feedback",
  ].forEach((key) => {
    assert.ok(de.staff[key], `de staff.${key} missing`);
    assert.ok(en.staff[key], `en staff.${key} missing`);
  });
});
