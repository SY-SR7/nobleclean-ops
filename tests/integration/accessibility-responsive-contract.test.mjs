import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

function listSourceFiles(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const stat = statSync(absolutePath);

  if (stat.isFile()) {
    return [absolutePath];
  }

  return readdirSync(absolutePath).flatMap((entry) =>
    listSourceFiles(path.join(relativePath, entry)),
  );
}

test("shared controls expose accessible semantics for progress and navigation", () => {
  const progress = readProjectFile("src/components/ui/progress-indicator.tsx");
  const mobileTabs = readProjectFile(
    "src/components/ui/mobile-bottom-tabs.tsx",
  );

  assert.match(progress, /role="progressbar"/);
  assert.match(progress, /aria-valuemin=\{0\}/);
  assert.match(progress, /aria-valuemax=\{max\}/);
  assert.match(progress, /aria-valuenow=\{value\}/);
  assert.match(mobileTabs, /aria-label=\{label\}/);
  assert.match(mobileTabs, /aria-current/);
});

test("employee mobile controls keep labels and avoid advisory-state locks", () => {
  const form = readProjectFile(
    "src/features/employee/my-day/MyDaySelectionForm.tsx",
  );
  const page = readProjectFile("src/app/[locale]/employee/page.tsx");

  assert.match(page, /htmlFor="my-day-date"/);
  assert.match(form, /<span className="sr-only">\{copy\.selectItem\}<\/span>/);
  assert.match(form, /name="completedLeafItemId"/);
  assert.doesNotMatch(form, /disabled=\{[^}]*advisoryStatus/);
  assert.doesNotMatch(form, /aria-disabled=\{[^}]*advisoryStatus/);
});

test("application source avoids viewport-scaled text and layout-hostile fixed widths", () => {
  const sourceFiles = listSourceFiles("src").filter((filePath) =>
    /\.(tsx?|jsx?)$/.test(filePath),
  );

  sourceFiles.forEach((filePath) => {
    const relativePath = path.relative(projectRoot, filePath);
    const source = readFileSync(filePath, "utf8");

    assert.doesNotMatch(source, /text-\[[^\]]*vw[^\]]*\]/, relativePath);
    assert.doesNotMatch(source, /font-size:\s*["'`][^"'`]*vw/, relativePath);
    assert.doesNotMatch(source, /w-\[[1-9]\d{3,}px\]/, relativePath);
  });
});

test("admin and employee shells keep distinct responsive layout strategies", () => {
  const adminShell = readProjectFile("src/components/layout/admin-shell.tsx");
  const employeeShell = readProjectFile(
    "src/components/layout/employee-shell.tsx",
  );

  assert.match(adminShell, /lg:grid-cols/);
  assert.match(adminShell, /max-w-\[var\(--nc-container-max\)\]/);
  assert.match(employeeShell, /max-w-3xl/);
  assert.match(employeeShell, /pb-24/);
});
