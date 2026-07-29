import { NextResponse } from "next/server";

export const API_JSON_BODY_LIMIT_BYTES = 1_048_576;

export function isRequestWithinJsonBodyLimit(
  request: Request,
  limitBytes = API_JSON_BODY_LIMIT_BYTES,
): boolean {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return true;
  }

  const parsedLength = Number.parseInt(contentLength, 10);

  return Number.isFinite(parsedLength) && parsedLength <= limitBytes;
}

export function genericApiErrorResponse(status = 400) {
  return NextResponse.json(
    { errorCode: "REQUEST_FAILED" },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  );
}
