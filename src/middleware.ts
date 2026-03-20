import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/teacher", "/vocabulary", "/reading", "/grammar"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];
const studentAllowedWithoutSubscription = ["/pricing", "/payment/success", "/payment/failure", "/login", "/dashboard/live-recordings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuth = authRoutes.some((route) => pathname.startsWith(route));

  if ((isProtected || isAdmin) && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isStudent = token?.role === "STUDENT";
  const hasActiveSubscription = token?.hasActiveSubscription === true;
  const isAllowedWithoutSubscription = studentAllowedWithoutSubscription.some((route) =>
    pathname.startsWith(route),
  );

  if (isStudent && !hasActiveSubscription && (isProtected || isAuth) && !isAllowedWithoutSubscription) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  if (isAuth && token) {
    if (isStudent && !hasActiveSubscription) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teacher/:path*",
    "/vocabulary/:path*",
    "/reading/:path*",
    "/grammar/:path*",
    "/admin/:path*",
    "/pricing/:path*",
    "/payment/success",
    "/payment/failure",
    "/login",
    "/register",
  ],
};
