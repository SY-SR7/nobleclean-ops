import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/routing";
import { isAllowedRequestHost } from "@/lib/security/host";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

function createNextResponse(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-nobleclean-current-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function proxy(request: NextRequest) {
  if (!isAllowedRequestHost(request.headers.get("host"))) {
    return new NextResponse(null, { status: 400 });
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return refreshSupabaseSession(request, createNextResponse(request));
  }

  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    return refreshSupabaseSession(request, createNextResponse(request));
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;

  return refreshSupabaseSession(request, NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
