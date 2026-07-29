import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import {
  getOptionalSupabaseConfig,
  supabaseCookieOptions,
} from "@/lib/supabase/config";

export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
) {
  const config = getOptionalSupabaseConfig();

  if (!config) {
    return response;
  }

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
