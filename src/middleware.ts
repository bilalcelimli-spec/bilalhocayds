import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { LOCALE_COOKIE, LOCALE_HEADER, splitLocalePrefix } from "@/src/i18n/config";

const protectedRoutes = ["/dashboard", "/teacher", "/vocabulary", "/reading", "/grammar"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];
const studentAllowedWithoutSubscription = ["/pricing", "/payment/success", "/payment/failure", "/login", "/dashboard", "/dashboard/live-recordings", "/exam"];

export async function middleware(req: NextRequest) {
  // /en/... ve /tr/... adresleri: dil önekini ayıkla, erişim kurallarını öneksiz adrese uygula.
  const { locale: prefixLocale, pathname } = splitLocalePrefix(req.nextUrl.pathname);
  const guardResponse = await guard(req, pathname);

  if (!prefixLocale) {
    return guardResponse ?? NextResponse.next();
  }

  let response = guardResponse;
  if (!response) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    const headers = new Headers(req.headers);
    headers.set(LOCALE_HEADER, prefixLocale);
    response = NextResponse.rewrite(url, { request: { headers } });
  }
  // Önekli bir adrese gelen ziyaretçi o dilde devam eder. Server action ve RSC isteklerinde
  // çerez yazılmaz; aksi halde dil seçicinin kaydettiği tercih aynı istekte ezilir.
  const isDocumentRequest = !req.headers.has("next-action") && !req.headers.has("rsc");
  if (isDocumentRequest) response.cookies.set(LOCALE_COOKIE, prefixLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

async function guard(req: NextRequest, pathname: string): Promise<NextResponse | null> {
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
  const hasStudentPlatformAccess = token?.hasStudentPlatformAccess === true;
  const isAllowedWithoutSubscription = studentAllowedWithoutSubscription.some((route) =>
    pathname.startsWith(route),
  );

  if (isStudent && hasStudentPlatformAccess) {
    if (pathname.startsWith("/reading") && token?.hasReadingAccess !== true) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }

    if (pathname.startsWith("/grammar") && token?.hasGrammarAccess !== true) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }

    if (pathname.startsWith("/vocabulary") && token?.hasVocabAccess !== true) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }

  }

  if (isStudent && !hasStudentPlatformAccess && (isProtected || isAuth) && !isAllowedWithoutSubscription) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  if (isAuth && token) {
    if (isStudent && !hasStudentPlatformAccess) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return null;
}

export const config = {
  matcher: [
    "/en",
    "/en/:path*",
    "/tr",
    "/tr/:path*",
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
