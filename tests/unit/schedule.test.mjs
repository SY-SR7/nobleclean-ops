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

test("admin schedule route and feature files exist", () => {
  [
    "src/app/[locale]/admin/schedule/page.tsx",
    "src/features/admin/schedule/actions.ts",
    "src/features/admin/schedule/queries.ts",
    "src/features/admin/schedule/schema.ts",
    "src/features/admin/schedule/ScheduleForms.tsx",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("schedule mutations enforce DTO, admin role, origin, and assignment-date validation", () => {
  const actions = readProjectFile("src/features/admin/schedule/actions.ts");
  const schema = readProjectFile("src/features/admin/schedule/schema.ts");

  assert.match(actions, /pickFormData/);
  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(locale,\s*"admin"\)/);
  assert.match(actions, /CreateScheduleInputSchema\.safeParse/);
  assert.match(actions, /UpdateScheduleInputSchema\.safeParse/);
  assert.match(actions, /hasActiveAssignmentForDate/);
  assert.match(actions, /employee_client_assignments/);
  assert.match(actions, /const insert:\s*ScheduleDbInsert\s*=/);
  assert.match(actions, /const update:\s*ScheduleDbUpdate\s*=/);
  assert.doesNotMatch(actions, /\.insert\(dto\)/);
  assert.doesNotMatch(actions, /\.update\(dto\)/);
  assert.match(schema, /\.strict\(\)/);
});

test("schedule reads are scoped through admin authorization", () => {
  const queries = readProjectFile("src/features/admin/schedule/queries.ts");
  const page = readProjectFile("src/app/[locale]/admin/schedule/page.tsx");

  assert.match(queries, /requireRole\(locale,\s*"admin"\)/);
  assert.match(queries, /work_schedule/);
  assert.match(page, /ScheduleForm/);
  assert.match(page, /DeleteScheduleForm/);
});

test("schedule UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "createTitle",
    "updateTitle",
    "schedulesTitle",
    "fields",
    "actions",
    "feedback",
  ].forEach((key) => {
    assert.ok(de.schedule[key], `de schedule.${key} missing`);
    assert.ok(en.schedule[key], `en schedule.${key} missing`);
  });
});
