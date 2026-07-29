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

test("employee My Day route and query file exist", () => {
  [
    "src/app/[locale]/employee/page.tsx",
    "src/features/employee/my-day/actions.ts",
    "src/features/employee/my-day/MyDaySelectionForm.tsx",
    "src/features/employee/my-day/queries.ts",
    "src/features/employee/my-day/schema.ts",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("employee My Day UI uses shared component library primitives", () => {
  const page = readProjectFile("src/app/[locale]/employee/page.tsx");
  const form = readProjectFile(
    "src/features/employee/my-day/MyDaySelectionForm.tsx",
  );

  assert.match(page, /MetricCard/);
  assert.match(form, /TaskItemCard/);
  assert.match(form, /ProgressIndicator/);
  assert.match(form, /PriorityStatusBadge/);
});

test("employee My Day data is read-only and scoped to the authenticated employee", () => {
  const queries = readProjectFile("src/features/employee/my-day/queries.ts");

  assert.match(queries, /requireRole\(locale,\s*"employee"\)/);
  assert.match(queries, /work_schedule/);
  assert.match(queries, /session\.profile\.id/);
  assert.match(queries, /get_assigned_client_leaf_item_status/);
  assert.match(queries, /daily_plans/);
  assert.match(queries, /daily_plan_items/);
  assert.doesNotMatch(queries, /\.insert\(/);
  assert.doesNotMatch(queries, /\.update\(/);
  assert.doesNotMatch(queries, /\.delete\(/);
});

test("employee My Day advisory statuses do not use system success as a leaf-item state", () => {
  const queries = readProjectFile("src/features/employee/my-day/queries.ts");

  assert.match(
    queries,
    /export type MyDayAdvisoryStatus = "critical" \| "recent" \| "warning" \| null;/,
  );
  assert.doesNotMatch(queries, /MyDayAdvisoryStatus = .*"success"/);
});

test("employee My Day advisory indicators match PRD Section 6 and remain visual-only", () => {
  const form = readProjectFile(
    "src/features/employee/my-day/MyDaySelectionForm.tsx",
  );
  const queries = readProjectFile("src/features/employee/my-day/queries.ts");

  assert.match(queries, /row\.tag === "high_priority"[\s\S]*return "critical"/);
  assert.match(queries, /row\.tag === "complaint"[\s\S]*return "warning"/);
  assert.match(
    queries,
    /elapsedDays >= 0[\s\S]*elapsedDays < row\.recurrence_days[\s\S]*\? "recent"/,
  );
  assert.match(form, /item\.advisoryStatus && label/);
  assert.doesNotMatch(form, /disabled=\{[^}]*item\.advisoryStatus/);
  assert.doesNotMatch(form, /aria-disabled=\{[^}]*item\.advisoryStatus/);
});

test("employee daily plan selection validates ownership through a single server action boundary", () => {
  const actions = readProjectFile("src/features/employee/my-day/actions.ts");
  const schema = readProjectFile("src/features/employee/my-day/schema.ts");
  const migration = readProjectFile(
    "supabase/migrations/20260729012000_daily_plan_selection.sql",
  );

  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(dto\.locale,\s*"employee"\)/);
  assert.match(actions, /save_current_employee_daily_plan_selection/);
  assert.match(actions, /submit_current_employee_daily_plan_completion/);
  assert.match(actions, /selected_leaf_item_ids: dto\.leafItemIds/);
  assert.match(actions, /completed_leaf_item_ids: dto\.completedLeafItemIds/);
  assert.match(actions, /mark_all_done: dto\.completeAll/);
  assert.match(schema, /leafItemIds: LeafItemIdsSchema/);
  assert.match(schema, /completedLeafItemIds: CompletedLeafItemIdsSchema/);
  assert.match(schema, /\.min\(1\)/);
  assert.match(migration, /current_employee_has_work_schedule/);
  assert.match(migration, /planned_minutes_below_allocated/);
  assert.match(migration, /daily_plan_items_delete_employee_selection/);
  assert.doesNotMatch(actions, /service_role|serviceRole|SUPABASE_SECRET_KEY/);
});

test("employee completion flow exposes bulk and partial completion controls", () => {
  const form = readProjectFile(
    "src/features/employee/my-day/MyDaySelectionForm.tsx",
  );
  const migration = readProjectFile(
    "supabase/migrations/20260729014000_daily_plan_completion.sql",
  );

  assert.match(form, /name="completeAll"/);
  assert.match(form, /name="completedLeafItemId"/);
  assert.match(form, /submitDailyPlanCompletionAction/);
  assert.match(migration, /completed_at = case/);
  assert.match(migration, /status = 'submitted'/);
  assert.match(migration, /submitted_at = completion_time/);
});

test("employee My Day UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "title",
    "dateLabel",
    "client",
    "allocatedHours",
    "plannedMinutes",
    "selectedItems",
    "remainingMinutes",
    "readyToSave",
    "currentPlan",
    "itemListTitle",
    "lastCleaned",
    "actions",
    "feedback",
  ].forEach((key) => {
    assert.ok(de.myDay[key], `de myDay.${key} missing`);
    assert.ok(en.myDay[key], `en myDay.${key} missing`);
  });
});
