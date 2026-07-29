import de from "@/i18n/messages/de.json";
import en from "@/i18n/messages/en.json";
import type { Locale } from "@/i18n/routing";

export type Messages = typeof de;

const messages: Record<Locale, Messages> = {
  de,
  en,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
