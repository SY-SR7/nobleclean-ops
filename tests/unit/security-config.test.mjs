import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

test("Supabase auth config keeps production account controls secure by default", () => {
  const config = readProjectFile("supabase/config.toml");

  [
    /enable_refresh_token_rotation\s*=\s*true/,
    /refresh_token_reuse_interval\s*=\s*10/,
    /enable_signup\s*=\s*false/,
    /enable_anonymous_sign_ins\s*=\s*false/,
    /minimum_password_length\s*=\s*12/,
    /password_requirements\s*=\s*"lower_upper_letters_digits_symbols"/,
    /secure_password_change\s*=\s*true/,
    /timebox\s*=\s*"24h"/,
    /inactivity_timeout\s*=\s*"8h"/,
    /max_enrolled_factors\s*=\s*3/,
    /\[auth\.mfa\.totp\][\s\S]*enroll_enabled\s*=\s*true/,
    /\[auth\.mfa\.totp\][\s\S]*verify_enabled\s*=\s*true/,
    /token_refresh\s*=\s*60/,
    /sign_in_sign_ups\s*=\s*10/,
    /token_verifications\s*=\s*10/,
  ].forEach((pattern) => {
    assert.match(config, pattern);
  });
});

test("Next.js config keeps baseline response hardening enabled", () => {
  const config = readProjectFile("next.config.ts");

  [
    /poweredByHeader:\s*false/,
    /Content-Security-Policy/,
    /default-src 'self'/,
    /base-uri 'self'/,
    /object-src 'none'/,
    /frame-ancestors 'none'/,
    /Strict-Transport-Security/,
    /max-age=63072000; includeSubDomains; preload/,
    /X-Frame-Options/,
    /DENY/,
    /X-Content-Type-Options/,
    /nosniff/,
    /Referrer-Policy/,
    /strict-origin-when-cross-origin/,
    /Permissions-Policy/,
    /Cross-Origin-Opener-Policy/,
    /Cross-Origin-Resource-Policy/,
    /X-DNS-Prefetch-Control/,
    /serverActions/,
    /serverActionBodySizeLimit\s*=\s*"1mb"/,
    /bodySizeLimit:\s*serverActionBodySizeLimit/,
  ].forEach((pattern) => {
    assert.match(config, pattern);
  });
});

test("production CSP avoids unsafe-eval while development keeps local tooling support", () => {
  const config = readProjectFile("next.config.ts");

  assert.match(config, /isDevelopment[\s\S]*unsafe-eval/);
  assert.match(
    config,
    /:\s*"script-src 'self' 'unsafe-inline'"/,
    "production script-src must not include unsafe-eval",
  );
});

test("host-header allowlist is enforced by proxy before routing", () => {
  const proxy = readProjectFile("src/proxy.ts");
  const hostGuard = readProjectFile("src/lib/security/host.ts");

  assert.match(proxy, /isAllowedRequestHost/);
  assert.match(proxy, /new NextResponse\(null,\s*\{\s*status:\s*400\s*\}\)/);
  assert.match(hostGuard, /NOBLECLEAN_ALLOWED_HOSTS/);
  assert.match(hostGuard, /LOCAL_DEVELOPMENT_HOSTS/);
  assert.match(hostGuard, /NODE_ENV\s*!==\s*"production"/);
});

test("login action has a generic fixed-window rate-limit guard", () => {
  const actions = readProjectFile("src/features/auth/actions.ts");
  const rateLimit = readProjectFile("src/lib/security/rate-limit.ts");

  assert.match(actions, /checkRequestRateLimit/);
  assert.match(actions, /scope:\s*"auth\.login"/);
  assert.match(actions, /limit:\s*5/);
  assert.match(actions, /return\s+\{\s*errorCode:\s*"AUTH_FAILED"\s*\}/);
  assert.match(rateLimit, /createHash\("sha256"\)/);
  assert.match(rateLimit, /x-forwarded-for/);
  assert.match(rateLimit, /x-real-ip/);
  assert.match(rateLimit, /__noblecleanRateLimits/);
});

test("API guardrails define local size limits and generic no-store errors", () => {
  const guardrails = readProjectFile("src/lib/security/api-guardrails.ts");

  assert.match(guardrails, /API_JSON_BODY_LIMIT_BYTES\s*=\s*1_048_576/);
  assert.match(guardrails, /content-length/);
  assert.match(guardrails, /REQUEST_FAILED/);
  assert.match(guardrails, /Cache-Control/);
  assert.match(guardrails, /no-store/);
});
