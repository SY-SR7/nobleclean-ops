import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

test("protected role route layouts enforce server-side role gates", () => {
  const adminLayout = readProjectFile("src/app/[locale]/admin/layout.tsx");
  const employeeLayout = readProjectFile(
    "src/app/[locale]/employee/layout.tsx",
  );

  assert.match(adminLayout, /requireRole\(locale,\s*"admin"\)/);
  assert.match(employeeLayout, /requireRole\(locale,\s*"employee"\)/);
  assert.match(adminLayout, /dynamic\s*=\s*"force-dynamic"/);
  assert.match(employeeLayout, /dynamic\s*=\s*"force-dynamic"/);
  assert.match(adminLayout, /fetchCache\s*=\s*"default-no-store"/);
  assert.match(employeeLayout, /fetchCache\s*=\s*"default-no-store"/);
});

test("auth state changes keep same-origin protection at every entry point", () => {
  const actions = readProjectFile("src/features/auth/actions.ts");
  const requestOrigin = readProjectFile("src/lib/security/request-origin.ts");
  const logoutRoute = readProjectFile("src/app/[locale]/logout/route.ts");

  assert.match(actions, /hasSameOriginRequest/);
  assert.match(requestOrigin, /headers\(\)/);
  assert.match(requestOrigin, /origin/);
  assert.match(requestOrigin, /host/);
  assert.match(logoutRoute, /hasSameOriginRequest/);
  assert.match(logoutRoute, /request\.headers\.get\("origin"\)/);
  assert.match(logoutRoute, /request\.headers\.get\("host"\)/);
});

test("logout route only exposes POST and responds with a redirect", () => {
  const logoutRoute = readProjectFile("src/app/[locale]/logout/route.ts");

  assert.match(logoutRoute, /export async function POST/);
  assert.doesNotMatch(logoutRoute, /export async function GET/);
  assert.match(logoutRoute, /status:\s*303/);
});
