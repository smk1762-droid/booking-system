import { NextResponse } from "next/server";

// 개발 모드: 인증 우회
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

/* 원본 미들웨어 (나중에 복구)
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/login", "/book", "/confirm", "/cancel", "/api/public"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (pathname.startsWith("/api/auth")) {
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
*/
