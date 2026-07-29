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
  assert.match(requestOrigin, /NODE_ENV\s*===\s*"production"/);
  assert.match(requestOrigin, /originUrl\.protocol\s*!==\s*"https:"/);
  assert.match(logoutRoute, /hasSameOriginRequest/);
  assert.match(logoutRoute, /isSameOrigin/);
  assert.match(logoutRoute, /request\.headers\.get\("origin"\)/);
  assert.match(logoutRoute, /request\.headers\.get\("host"\)/);
});

test("logout route only exposes POST and responds with a redirect", () => {
  const logoutRoute = readProjectFile("src/app/[locale]/logout/route.ts");

  assert.match(logoutRoute, /export async function POST/);
  assert.doesNotMatch(logoutRoute, /export async function GET/);
  assert.match(logoutRoute, /status:\s*303/);
});

test("localized root and protected redirects preserve safe relative destinations", () => {
  const rootPage = readProjectFile("src/app/[locale]/page.tsx");
  const guards = readProjectFile("src/server/auth/guards.ts");
  const proxy = readProjectFile("src/proxy.ts");
  const redirects = readProjectFile("src/lib/security/redirects.ts");
  const actions = readProjectFile("src/features/auth/actions.ts");

  assert.match(rootPage, /getAuthenticatedSession/);
  assert.match(rootPage, /redirect\(`\/\$\{locale\}\/login`\)/);
  assert.match(rootPage, /session\.profile\.role === "admin"/);
  assert.match(rootPage, /`\/\$\{locale\}\/admin`/);
  assert.match(rootPage, /`\/\$\{locale\}\/employee`/);
  assert.match(proxy, /x-nobleclean-current-path/);
  assert.match(guards, /currentRequestPath/);
  assert.match(guards, /appendSafeNextParam/);
  assert.match(guards, /safeLocalizedRedirectPath/);
  assert.match(
    guards,
    /loginPath\(locale,\s*await currentRequestPath\(locale\)\)/,
  );
  assert.match(actions, /safeLocalizedRedirectPath\(next,\s*locale\)/);
  assert.match(redirects, /value\.startsWith\("\/\/"\)/);
  assert.match(redirects, /parsed\.origin !== LOCAL_REDIRECT_ORIGIN/);
  assert.match(redirects, /startsWith\(`\$\{localeRoot\}\/`\)/);
});
