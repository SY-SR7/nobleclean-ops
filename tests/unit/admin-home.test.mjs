import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

test("admin home is guarded before rendering dashboard content", () => {
  const page = readProjectFile("src/app/[locale]/admin/page.tsx");
  const query = readProjectFile("src/features/admin/home/queries.ts");

  assert.match(page, /dynamic\s*=\s*"force-dynamic"/);
  assert.match(page, /fetchCache\s*=\s*"default-no-store"/);
  assert.match(page, /requireRole\(locale,\s*"admin"\)/);
  assert.match(page, /getAdminHomeData\(locale\)/);
  assert.match(query, /requireRole\(locale,\s*"admin"\)/);
  assert.match(query, /createSupabaseServerClient/);
  assert.doesNotMatch(
    query,
    /service_role|serviceRole|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("admin home renders operational dashboard sections from shared primitives", () => {
  const page = readProjectFile("src/app/[locale]/admin/page.tsx");
  const query = readProjectFile("src/features/admin/home/queries.ts");

  assert.match(page, /MetricCard/);
  assert.match(page, /PriorityStatusBadge/);
  assert.match(page, /adminHome\.metrics\.activeClients/);
  assert.match(page, /adminHome\.metrics\.activeAssignments/);
  assert.match(page, /adminHome\.metrics\.dueItems/);
  assert.match(page, /adminHome\.metrics\.mandatoryEscalations/);
  assert.match(page, /adminHome\.sections\.recentWork/);
  assert.match(page, /adminHome\.sections\.workflows/);
  assert.match(query, /mandatory_cleaning_tool_step_status/);
  assert.match(query, /leaf_item_last_cleaned/);
  assert.match(query, /daily_plans/);
});
