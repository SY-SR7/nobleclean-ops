import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const componentFiles = [
  "button",
  "form-input",
  "form-textarea",
  "metric-card",
  "mobile-bottom-tabs",
  "object-tree-row",
  "priority-status-badge",
  "progress-indicator",
  "search-input",
  "task-item-card",
  "tool-step-card",
];

test("shared component library exposes every PRD Section 7.5 primitive", () => {
  const index = readFileSync(
    path.join(projectRoot, "src/components/ui/index.ts"),
    "utf8",
  );

  componentFiles.forEach((componentFile) => {
    const componentPath = path.join(
      projectRoot,
      "src/components/ui",
      `${componentFile}.tsx`,
    );

    assert.equal(
      existsSync(componentPath),
      true,
      `${componentFile} is missing`,
    );
    assert.match(index, new RegExp(`export \\* from "\\./${componentFile}"`));
  });
});

test("shared UI components remain prop-driven and do not embed locale copy", () => {
  const forbiddenVisibleCopy = [
    "Tasks",
    "Notifications",
    "History",
    "Profile",
    "Aufgaben",
    "Mitteilungen",
    "Verlauf",
    "Profil",
    "High priority",
    "Complaint",
    "Recently cleaned",
  ];

  componentFiles.forEach((componentFile) => {
    const content = readFileSync(
      path.join(projectRoot, "src/components/ui", `${componentFile}.tsx`),
      "utf8",
    );

    forbiddenVisibleCopy.forEach((copy) => {
      assert.equal(
        content.includes(copy),
        false,
        `${componentFile} embeds visible copy: ${copy}`,
      );
    });
  });
});
