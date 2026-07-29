import type { Messages } from "@/i18n/messages";

type MessageValue = string | { [key: string]: MessageValue };

export function t(messages: Messages, key: string): string {
  const value = key
    .split(".")
    .reduce<MessageValue | undefined>(
      (current, segment) =>
        typeof current === "object" && current !== null
          ? current[segment]
          : undefined,
      messages,
    );

  if (typeof value !== "string") {
    throw new Error(`Missing translation key: ${key}`);
  }

  return value;
}
