import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const globalsPath = path.join(projectRoot, "src/app/globals.css");
const sourceRoot = path.join(projectRoot, "src");
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

function readProjectFile(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return listSourceFiles(absolutePath);
    }

    return sourceExtensions.has(path.extname(absolutePath))
      ? [absolutePath]
      : [];
  });
}

test("Operational Clarity color tokens are defined in the Tailwind theme source", () => {
  const css = readFileSync(globalsPath, "utf8").toLowerCase();

  [
    "--nc-color-primary: #001f34",
    "--nc-color-primary-container: #003554",
    "--nc-color-secondary: #00677c",
    "--nc-color-secondary-container: #57dcff",
    "--nc-color-surface: #f7f9fb",
    "--nc-color-surface-accent: #ebfafc",
    "--nc-color-status-critical: #e11d48",
    "--nc-color-status-warning: #f59e0b",
    "--nc-color-status-recent: #87cba1",
    "--nc-color-status-success: #10b981",
  ].forEach((token) => {
    assert.ok(css.includes(token), `${token} is missing`);
  });
});

test("source styling does not duplicate raw hex colors outside globals.css", () => {
  const hexColor = /#[0-9a-fA-F]{3,8}\b/g;
  const offenders = listSourceFiles(sourceRoot)
    .filter((filePath) => path.resolve(filePath) !== path.resolve(globalsPath))
    .flatMap((filePath) => {
      const content = readFileSync(filePath, "utf8");
      const matches = content.match(hexColor) ?? [];

      return matches.map((match) => ({
        color: match,
        path: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
      }));
    });

  assert.deepEqual(offenders, []);
});

test("status token exports keep leaf-item advisory states separate from system success", () => {
  const tokens = readProjectFile("src/lib/design-tokens.ts");
  const leafBlock =
    tokens.match(/leafItemStatusTokens\s*=\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert.match(leafBlock, /critical:\s*"status-critical"/);
  assert.match(leafBlock, /warning:\s*"status-warning"/);
  assert.match(leafBlock, /recent:\s*"status-recent"/);
  assert.doesNotMatch(leafBlock, /status-success/);
  assert.match(tokens, /success:\s*"status-success"/);
});
