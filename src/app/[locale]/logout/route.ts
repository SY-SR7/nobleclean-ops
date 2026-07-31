import { NextResponse, type NextRequest } from "next/server";

import { isLocale } from "@/i18n/routing";
import { isSameOrigin } from "@/lib/security/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LogoutRouteContext = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

function hasSameOriginRequest(request: NextRequest): boolean {
  return isSameOrigin(
    request.headers.get("origin"),
    request.headers.get("host"),
  );
}

export async function GET(
  request: NextRequest,
  { params }: LogoutRouteContext,
) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "de";

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Keep logout responses generic.
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url), {
    status: 303,
  });
}

export async function POST(
  request: NextRequest,
  { params }: LogoutRouteContext,
) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "de";

  if (hasSameOriginRequest(request)) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Keep logout responses generic and avoid exposing auth internals.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url), {
    status: 303,
  });
}
