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
  assert.match(layoutIndex, /export \* from "\.\/brand-logo"/);
  assert.match(layoutIndex, /export \* from "\.\/employee-shell"/);
});

test("admin shell exposes mobile navigation, sign out, skip link, and sticky sidebar", () => {
  const adminLayout = readProjectFile("src/app/[locale]/admin/layout.tsx");
  const adminShell = readProjectFile("src/components/layout/admin-shell.tsx");
  const adminNavigation = readProjectFile(
    "src/components/layout/admin-navigation.tsx",
  );

  assert.match(adminLayout, /auth\.logout\.submit/);
  assert.match(adminLayout, /navigation\.skipToContent/);
  assert.match(adminShell, /logoutAction/);
  assert.match(adminShell, /href="#admin-main"/);
  assert.match(adminShell, /id="admin-main"/);
  assert.match(adminShell, /lg:sticky/);
  assert.match(adminShell, /variant="mobile"/);
  assert.match(adminNavigation, /variant\?: "mobile" \| "sidebar"/);
  assert.match(adminNavigation, /aria-current/);
  assert.match(adminNavigation, /focus-visible:ring-secondary/);
});

test("layout shells render the logo through the shared BrandLogo primitive", () => {
  const brandLogo = readProjectFile("src/components/layout/brand-logo.tsx");
  const adminShell = readProjectFile("src/components/layout/admin-shell.tsx");
  const employeeShell = readProjectFile(
    "src/components/layout/employee-shell.tsx",
  );

  assert.match(brandLogo, /src="\/logo\.png"/);
  assert.match(adminShell, /BrandLogo/);
  assert.match(employeeShell, /BrandLogo/);
  assert.doesNotMatch(adminShell, /appName/);
  assert.doesNotMatch(employeeShell, /appName/);
  assert.doesNotMatch(adminShell, /src="\/logo\.png"/);
  assert.doesNotMatch(employeeShell, /src="\/logo\.png"/);
});
