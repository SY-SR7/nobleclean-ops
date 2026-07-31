import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

// Private avatar image proxy.
// Validates the path, checks admin auth, then streams the private bucket object.

export async function GET(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.searchParams.get("path");

  if (!path || typeof path !== "string") {
    return new NextResponse(null, { status: 400 });
  }

  // Strict path validation — must match avatar storage pattern
  const valid =
    /^avatars\/(employees|clients)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(
      path,
    );

  if (!valid) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Any authenticated admin can view avatars
    await requireRole("en", "admin");
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage.from("avatars").download(path);

    if (error || !data) {
      return new NextResponse(null, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const contentType = data.type || "image/jpeg";

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(arrayBuffer.byteLength),
      },
      status: 200,
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
