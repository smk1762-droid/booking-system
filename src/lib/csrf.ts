import { NextResponse } from "next/server";

export function verifyCsrf(request: Request): NextResponse | null {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    return null;
  }

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      return NextResponse.json(
        { error: "요청이 거부되었습니다" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "요청이 거부되었습니다" },
      { status: 403 }
    );
  }

  return null;
}
