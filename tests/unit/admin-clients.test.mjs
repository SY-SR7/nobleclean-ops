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

test("admin client management route and feature files exist", () => {
  [
    "src/app/[locale]/admin/clients/page.tsx",
    "src/features/admin/clients/actions.ts",
    "src/features/admin/clients/queries.ts",
    "src/features/admin/clients/schema.ts",
    "src/features/admin/clients/ClientForm.tsx",
  ].forEach((relativePath) => {
    assert.equal(
      existsSync(path.join(projectRoot, relativePath)),
      true,
      `${relativePath} is missing`,
    );
  });
});

test("admin client mutations use DTO boundaries and admin authorization", () => {
  const actions = readProjectFile("src/features/admin/clients/actions.ts");
  const schema = readProjectFile("src/features/admin/clients/schema.ts");

  assert.match(actions, /pickFormData/);
  assert.match(actions, /CreateClientInputSchema\.safeParse/);
  assert.match(actions, /UpdateClientInputSchema\.safeParse/);
  assert.match(actions, /SetClientActiveInputSchema\.safeParse/);
  assert.match(actions, /hasSameOriginRequest/);
  assert.match(actions, /requireRole\(locale,\s*"admin"\)/);
  assert.match(actions, /const insert:\s*ClientDbInsert\s*=/);
  assert.match(actions, /const update:\s*ClientDbUpdate\s*=/);
  assert.doesNotMatch(actions, /\.insert\(dto\)/);
  assert.doesNotMatch(actions, /\.update\(dto\)/);
  assert.doesNotMatch(actions, /\.delete\(/);
  assert.match(schema, /\.strict\(\)/);
  assert.match(schema, /buildClientContactInfo/);
  assert.match(actions, /contact_info:\s*buildClientContactInfo/);
});

test("admin client reads are scoped through the admin role guard", () => {
  const queries = readProjectFile("src/features/admin/clients/queries.ts");
  const page = readProjectFile("src/app/[locale]/admin/clients/page.tsx");

  assert.match(queries, /requireRole\(locale,\s*"admin"\)/);
  assert.match(page, /listAdminClients\(locale,\s*query\)/);
  assert.match(page, /ClientStatusForm/);
  assert.match(page, /ClientForm/);
});

test("admin client UI copy lives in German and English message catalogs", () => {
  const de = JSON.parse(readProjectFile("src/i18n/messages/de.json"));
  const en = JSON.parse(readProjectFile("src/i18n/messages/en.json"));

  [
    "createTitle",
    "editTitle",
    "searchLabel",
    "empty",
    "fields",
    "actions",
    "status",
    "summary",
    "feedback",
  ].forEach((key) => {
    assert.ok(de.adminClients[key], `de adminClients.${key} missing`);
    assert.ok(en.adminClients[key], `en adminClients.${key} missing`);
  });
});
