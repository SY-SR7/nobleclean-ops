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

test("admin and employee layout shells are wired into protected route layouts", () => {
  const adminLayout = readProjectFile("src/app/[locale]/admin/layout.tsx");
  const employeeLayout = readProjectFile(
    "src/app/[locale]/employee/layout.tsx",
  );

  assert.match(adminLayout, /AdminShell/);
  assert.match(employeeLayout, /EmployeeShell/);
  assert.match(adminLayout, /navigation\.admin\.home/);
  assert.match(employeeLayout, /navigation\.employee\.tasks/);
});

test("layout shell assets and exports exist", () => {
  assert.equal(
    existsSync(path.join(projectRoot, "public/logo.png")),
    true,
    "public logo asset is missing",
  );

  const layoutIndex = readProjectFile("src/components/layout/index.ts");
  assert.match(layoutIndex, /export \* from "\.\/admin-shell"/);
  assert.match(layoutIndex, /export \* from "\.\/employee-shell"/);
});
