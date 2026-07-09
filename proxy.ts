import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutePrefixes = ["/signin", "/api/auth", "/invoice", "/feedback"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!request.auth && !isPublicRoute) {
    const signInUrl = new URL("/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
