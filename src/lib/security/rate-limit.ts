import { createHash } from "node:crypto";

import { headers } from "next/headers";

type RateLimitOptions = Readonly<{
  limit: number;
  scope: string;
  windowMs: number;
  keyParts?: readonly string[];
}>;

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitGlobal = typeof globalThis & {
  __noblecleanRateLimits?: Map<string, RateLimitRecord>;
};

const STORE_MAX_ENTRIES = 10_000;

function getStore() {
  const globalStore = globalThis as RateLimitGlobal;
  globalStore.__noblecleanRateLimits ??= new Map<string, RateLimitRecord>();
  return globalStore.__noblecleanRateLimits;
}

function firstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

function hashRateLimitKey(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function pruneExpiredRecords(store: Map<string, RateLimitRecord>, now: number) {
  if (store.size < STORE_MAX_ENTRIES) {
    return;
  }

  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

export async function checkRequestRateLimit(
  options: RateLimitOptions,
): Promise<boolean> {
  const headerStore = await headers();
  const forwardedFor = firstHeaderValue(headerStore.get("x-forwarded-for"));
  const realIp = firstHeaderValue(headerStore.get("x-real-ip"));
  const userAgent = firstHeaderValue(headerStore.get("user-agent"));
  const key = hashRateLimitKey([
    options.scope,
    forwardedFor,
    realIp,
    userAgent,
    ...(options.keyParts ?? []),
  ]);
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key);

  pruneExpiredRecords(store, now);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return true;
  }

  if (existing.count >= options.limit) {
    return false;
  }

  existing.count += 1;
  return true;
}
