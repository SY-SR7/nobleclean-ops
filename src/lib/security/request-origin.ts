import { headers } from "next/headers";

export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);

    if (
      process.env.NODE_ENV === "production" &&
      originUrl.protocol !== "https:"
    ) {
      return false;
    }

    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function hasSameOriginRequest(): Promise<boolean> {
  const headerStore = await headers();
  return isSameOrigin(headerStore.get("origin"), headerStore.get("host"));
}
