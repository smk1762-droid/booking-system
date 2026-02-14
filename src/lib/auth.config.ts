import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "./env";

export const authConfig = {
  providers: [
    Google({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/bookings") ||
        nextUrl.pathname.startsWith("/appointment-types") ||
        nextUrl.pathname.startsWith("/schedules") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        // Redirect to dashboard if logged in and on public page
        if (nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
