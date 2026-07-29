import type { Locale } from "@/i18n/routing";

const LOCAL_REDIRECT_ORIGIN = "https://nobleclean.local";

export function safeLocalizedRedirectPath(
  value: string | null | undefined,
  locale: Locale,
  fallback = `/${locale}`,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const parsed = new URL(value, LOCAL_REDIRECT_ORIGIN);
  const localeRoot = `/${locale}`;
  const isLocalePath =
    parsed.pathname === localeRoot ||
    parsed.pathname.startsWith(`${localeRoot}/`);

  if (parsed.origin !== LOCAL_REDIRECT_ORIGIN || !isLocalePath) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function appendSafeNextParam(path: string, nextPath?: string): string {
  if (!nextPath) {
    return path;
  }

  return `${path}?next=${encodeURIComponent(nextPath)}`;
}
