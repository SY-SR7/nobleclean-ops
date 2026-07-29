type SupabaseConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

const SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function readValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && !value.includes("<") ? value : null;
}

export function getOptionalSupabaseConfig(): SupabaseConfig | null {
  const url = readValue(SUPABASE_URL);
  const publishableKey = readValue(SUPABASE_PUBLISHABLE_KEY);

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getRequiredSupabaseConfig(): SupabaseConfig {
  const config = getOptionalSupabaseConfig();

  if (!config) {
    throw new Error("Supabase public configuration is missing.");
  }

  return config;
}

export const supabaseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
