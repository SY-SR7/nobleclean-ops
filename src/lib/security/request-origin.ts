import { headers } from "next/headers";

export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function hasSameOriginRequest(): Promise<boolean> {
  const headerStore = await headers();
  return isSameOrigin(headerStore.get("origin"), headerStore.get("host"));
}
