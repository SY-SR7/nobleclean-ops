import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const messagesDirectory = new URL("../../src/i18n/messages/", import.meta.url);

function readMessages(locale) {
  return JSON.parse(
    readFileSync(new URL(`${locale}.json`, messagesDirectory), "utf8"),
  );
}

function flattenKeys(value, prefix = "") {
  assert.equal(typeof value, "object", `${prefix || "root"} must be an object`);
  assert.notEqual(value, null, `${prefix || "root"} must not be null`);
  assert.equal(
    Array.isArray(value),
    false,
    `${prefix || "root"} must not be an array`,
  );

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = prefix ? `${prefix}.${key}` : key;

    if (typeof child === "string") {
      return [childPath];
    }

    return flattenKeys(child, childPath);
  });
}

function flattenValues(value) {
  if (typeof value === "string") {
    return [value];
  }

  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);

  return Object.values(value).flatMap(flattenValues);
}

test("German and English message catalogs expose the same keys", () => {
  const deKeys = flattenKeys(readMessages("de")).sort();
  const enKeys = flattenKeys(readMessages("en")).sort();

  assert.deepEqual(deKeys, enKeys);
});

test("application message catalogs stay within the approved German/English UI locales", () => {
  const arabicScript = /[\u0600-\u06ff]/u;
  const allValues = [
    ...flattenValues(readMessages("de")),
    ...flattenValues(readMessages("en")),
  ];

  allValues.forEach((value) => {
    assert.equal(
      arabicScript.test(value),
      false,
      `Unexpected Arabic UI text: ${value}`,
    );
  });
});
