import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);

function readProjectFile(relativePath) {
  return readFileSync(new URL(relativePath, projectRoot), "utf8");
}

test("auth pages share the AuthShell wordmark layout", () => {
  const authShell = readProjectFile("src/features/auth/AuthShell.tsx");
  const loginPage = readProjectFile("src/app/[locale]/login/page.tsx");
  const mfaPage = readProjectFile("src/app/[locale]/auth/mfa/page.tsx");

  assert.match(authShell, /from "next\/image"/);
  assert.match(authShell, /src="\/logo\.png"/);
  assert.match(authShell, /priority/);
  assert.match(authShell, /aria-labelledby=\{headingId\}/);
  assert.match(loginPage, /<AuthShell/);
  assert.match(loginPage, /auth\.login\.support/);
  assert.match(mfaPage, /<AuthShell/);
  assert.match(mfaPage, /logoutAction/);
});

test("login form uses shared visual primitives and announces generic errors", () => {
  const loginForm = readProjectFile("src/features/auth/LoginForm.tsx");

  assert.match(loginForm, /FormInput/);
  assert.match(loginForm, /Button/);
  assert.doesNotMatch(loginForm, /<button[\s>]/);
  assert.doesNotMatch(loginForm, /<input\s+[^>]*type="email"/);
  assert.doesNotMatch(loginForm, /<input\s+[^>]*type="password"/);
  assert.match(loginForm, /role="alert"/);
  assert.match(loginForm, /aria-live="polite"/);
  assert.match(loginForm, /aria-describedby=\{inputDescribedBy\}/);
  assert.match(loginForm, /aria-invalid=\{hasError \|\| undefined\}/);
});

test("shared auth controls expose tokenized focus-visible rings", () => {
  const button = readProjectFile("src/components/ui/button.tsx");
  const formInput = readProjectFile("src/components/ui/form-input.tsx");

  assert.match(button, /focus-visible:ring-2/);
  assert.match(button, /focus-visible:ring-offset-2/);
  assert.match(formInput, /focus-visible:ring-2/);
  assert.match(formInput, /focus-visible:ring-offset-2/);
});
