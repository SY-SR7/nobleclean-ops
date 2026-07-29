export const locales = ["de", "en"] as const;
export const defaultLocale = "de";

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
