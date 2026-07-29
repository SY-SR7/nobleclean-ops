import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

const protectedRouteFiles = [
  "src/app/[locale]/admin/layout.tsx",
  "src/app/[locale]/admin/page.tsx",
  "src/app/[locale]/admin/clients/page.tsx",
  "src/app/[locale]/admin/reports/page.tsx",
  "src/app/[locale]/admin/schedule/page.tsx",
  "src/app/[locale]/admin/sections-items/page.tsx",
  "src/app/[locale]/admin/staff/page.tsx",
  "src/app/[locale]/employee/layout.tsx",
  "src/app/[locale]/employee/page.tsx",
];

const mutationBoundaryFiles = [
  ["src/features/admin/clients/actions.ts", "admin"],
  ["src/features/admin/schedule/actions.ts", "admin"],
  ["src/features/admin/sections-items/actions.ts", "admin"],
  ["src/features/admin/staff/actions.ts", "admin"],
  ["src/features/employee/my-day/actions.ts", "employee"],
];

test("all protected workflow surfaces are dynamic and no-store", () => {
  protectedRouteFiles.forEach((relativePath) => {
    const source = readProjectFile(relativePath);

    assert.match(
      source,
      /dynamic\s*=\s*"force-dynamic"/,
      `${relativePath} must force dynamic rendering`,
    );
    assert.match(
      source,
      /fetchCache\s*=\s*"default-no-store"/,
      `${relativePath} must avoid cached protected data`,
    );
  });
});

test("all mutation entry points enforce same-origin and role boundaries", () => {
  mutationBoundaryFiles.forEach(([relativePath, role]) => {
    const source = readProjectFile(relativePath);

    assert.match(source, /hasSameOriginRequest/, `${relativePath} origin gate`);
    assert.match(
      source,
      new RegExp(`requireRole\\([^,]+,\\s*"${role}"\\)`),
      `${relativePath} role gate`,
    );
    assert.doesNotMatch(
      source,
      /service_role|serviceRole|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/,
      `${relativePath} must not use privileged Supabase keys`,
    );
  });
});

test("employee completion and last-cleaned coverage remain connected", () => {
  const completionMigration = readProjectFile(
    "supabase/migrations/20260729153000_cleaning_tool_steps.sql",
  );
  const derivedReadModelsTest = readProjectFile(
    "supabase/tests/database/derived_read_models.test.sql",
  );
  const coreRlsTest = readProjectFile(
    "supabase/tests/database/core_rls.test.sql",
  );

  assert.match(completionMigration, /completed_at = case/);
  assert.match(completionMigration, /daily_plan_item_steps/);
  assert.match(completionMigration, /completed_cleaning_tool_step_ids/);
  assert.match(completionMigration, /Missing mandatory steps remain advisory/i);
  assert.match(completionMigration, /status = 'submitted'/);
  assert.match(coreRlsTest, /submit_current_employee_daily_plan_completion/);
  assert.match(derivedReadModelsTest, /leaf_item_last_cleaned/);
  assert.match(derivedReadModelsTest, /get_assigned_client_leaf_item_status/);
});
