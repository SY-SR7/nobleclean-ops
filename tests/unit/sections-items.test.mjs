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

test("admin sections/items route and feature files exist", () => {
  [
    "src/app/[locale]/admin/sections-items/page.tsx",
    "src/features/admin/sections-items/actions.ts",
    "src/features/admin/sections-items/queries.ts",
    "src/features/admin/sections-items/schema.ts",
    "src/features/admin/sections-items/SectionsItemsForms.tsx",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("sections/items UI uses shared tree and item primitives", () => {
  const page = readProjectFile(
    "src/app/[locale]/admin/sections-items/page.tsx",
  );

  assert.match(page, /ObjectTreeRow/);
  assert.match(page, /TaskItemCard/);
  assert.match(page, /PriorityStatusBadge/);
  assert.match(page, /SectionForm/);
  assert.match(page, /LeafItemForm/);
});

test("sections/items mutations enforce DTO, role, origin, and object scope", () => {
  const actions = readProjectFile(
    "src/features/admin/sections-items/actions.ts",
  );
  const schema = readProjectFile("src/features/admin/sections-items/schema.ts");

  assert.match(actions, /pickFormData/);
  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(locale,\s*"admin"\)/);
  assert.match(actions, /CreateSectionInputSchema\.safeParse/);
  assert.match(actions, /UpdateSectionInputSchema\.safeParse/);
  assert.match(actions, /CreateLeafItemInputSchema\.safeParse/);
  assert.match(actions, /UpdateLeafItemInputSchema\.safeParse/);
  assert.match(actions, /sectionBelongsToClient/);
  assert.match(actions, /leafItemBelongsToClient/);
  assert.match(actions, /const insert:\s*SectionDbInsert\s*=/);
  assert.match(actions, /const insert:\s*LeafItemDbInsert\s*=/);
  assert.doesNotMatch(actions, /\.insert\(dto\)/);
  assert.doesNotMatch(actions, /\.update\(dto\)/);
  assert.match(schema, /\.strict\(\)/);
});

test("reference image upload uses server-generated paths and binary validation", () => {
  const actions = readProjectFile(
    "src/features/admin/sections-items/actions.ts",
  );

  assert.match(actions, /MaxReferenceImageBytes/);
  assert.match(actions, /magic\(buffer\)/);
  assert.match(actions, /sharp\(buffer\)\.metadata/);
  assert.match(actions, /randomUUID\(\)/);
  assert.match(actions, /reference-images/);
  assert.match(actions, /contentType:\s*image\.contentType/);
  assert.doesNotMatch(actions, /file\.name/);
});

test("sections/items UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  ["clientLabel", "treeTitle", "fields", "actions", "tags", "feedback"].forEach(
    (key) => {
      assert.ok(de.sectionsItems[key], `de sectionsItems.${key} missing`);
      assert.ok(en.sectionsItems[key], `en sectionsItems.${key} missing`);
    },
  );
});
