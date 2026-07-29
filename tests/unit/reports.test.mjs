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

test("admin reports route and query file exist", () => {
  [
    "src/app/[locale]/admin/reports/page.tsx",
    "src/features/admin/reports/queries.ts",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("admin reports UI uses shared reporting primitives", () => {
  const page = readProjectFile("src/app/[locale]/admin/reports/page.tsx");

  assert.match(page, /MetricCard/);
  assert.match(page, /TaskItemCard/);
  assert.match(page, /ToolStepCard/);
  assert.match(page, /PriorityStatusBadge/);
});

test("admin reports are read-only and scoped through admin authorization", () => {
  const queries = readProjectFile("src/features/admin/reports/queries.ts");

  assert.match(queries, /requireRole\(locale,\s*"admin"\)/);
  assert.match(queries, /daily_plans/);
  assert.match(queries, /daily_plan_items/);
  assert.match(queries, /leaf_item_last_cleaned/);
  assert.match(queries, /mandatory_cleaning_tool_step_status/);
  assert.doesNotMatch(queries, /\.insert\(/);
  assert.doesNotMatch(queries, /\.update\(/);
  assert.doesNotMatch(queries, /\.delete\(/);
});

test("admin reports surface mandatory tool-step escalations as advisory status", () => {
  const page = readProjectFile("src/app/[locale]/admin/reports/page.tsx");
  const queries = readProjectFile("src/features/admin/reports/queries.ts");
  const migration = readProjectFile(
    "supabase/migrations/20260729153000_cleaning_tool_steps.sql",
  );

  assert.match(page, /mandatoryStepEscalations/);
  assert.match(page, /MandatoryStepEscalationCard/);
  assert.match(queries, /is_overdue/);
  assert.match(queries, /last_performed_at/);
  assert.match(
    migration,
    /Overdue status is an escalation signal, not an employee selection lock/,
  );
});

test("admin reports UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "clientLabel",
    "dateFrom",
    "dateTo",
    "totalPlans",
    "completePlans",
    "incompletePlans",
    "completionRate",
    "mandatoryStepEscalations",
    "lastCleaned",
    "lastPerformed",
    "mandatory",
    "employee",
    "emptyMandatoryStepEscalations",
    "actions",
    "feedback",
  ].forEach((key) => {
    assert.ok(de.reports[key], `de reports.${key} missing`);
    assert.ok(en.reports[key], `en reports.${key} missing`);
  });
});
