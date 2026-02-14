import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (pathname.startsWith("/api/auth")) {
    return;
  }

  // CSRF 보호: API 변경 요청에 대해 Origin 검증
  if (pathname.startsWith("/api/") && method !== "GET" && method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: "요청이 거부되었습니다" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "요청이 거부되었습니다" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  const publicRoutes = ["/login", "/book", "/confirm", "/cancel", "/api/public"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return;
  }

  const protectedRoutes = ["/", "/bookings", "/appointment-types", "/schedules", "/settings"];
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
