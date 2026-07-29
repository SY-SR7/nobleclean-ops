import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getRequiredSupabaseConfig,
  supabaseCookieOptions,
} from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getRequiredSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Route handlers,
          // Server Actions, and proxy refresh paths provide writable cookies.
        }
      },
    },
  });
}
