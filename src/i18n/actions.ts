"use server";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/src/auth";
import { isLocale, LOCALE_COOKIE } from "@/src/i18n/config";
import { prisma } from "@/src/lib/prisma";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setUserLocale(locale: string) {
  if (!isLocale(locale)) {
    return { ok: false as const };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { locale } }).catch(() => undefined);
  }

  return { ok: true as const };
}
