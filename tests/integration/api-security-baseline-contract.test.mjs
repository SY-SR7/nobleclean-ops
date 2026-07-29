import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

function listRouteFiles(relativeDir) {
  const directoryUrl = new URL(relativeDir, projectRoot);

  if (!existsSync(directoryUrl)) {
    return [];
  }

  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const childPath = `${relativeDir.replace(/\/$/, "")}/${entry.name}`;

    if (entry.isDirectory()) {
      return listRouteFiles(childPath);
    }

    const childUrl = new URL(childPath, projectRoot);

    if (!statSync(childUrl).isFile() || entry.name !== "route.ts") {
      return [];
    }

    return [childPath];
  });
}

test("proxy covers API paths without locale-redirecting them", () => {
  const proxy = readProjectFile("src/proxy.ts");

  assert.match(proxy, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(
    proxy,
    /refreshSupabaseSession\(request,\s*createNextResponse\(request\)\)/,
  );
  assert.doesNotMatch(proxy, /api\|_next/);
});

test("future API route handlers must use the shared security guardrails", () => {
  const routeFiles = listRouteFiles("src/app/api");
  const guardrails = readProjectFile("src/lib/security/api-guardrails.ts");

  assert.match(guardrails, /isRequestWithinJsonBodyLimit/);
  assert.match(guardrails, /genericApiErrorResponse/);

  routeFiles.forEach((relativePath) => {
    const source = readProjectFile(relativePath);

    assert.match(
      source,
      /isRequestWithinJsonBodyLimit|genericApiErrorResponse/,
      `${relativePath} must enforce request-size and generic-error guardrails`,
    );
    assert.doesNotMatch(
      source,
      /error\.message|stack|details|cause/,
      `${relativePath} must not expose raw error internals`,
    );
    assert.doesNotMatch(
      source,
      /Access-Control-Allow-Origin["'\s:]*\*/,
      `${relativePath} must not enable wildcard CORS`,
    );
  });
});
