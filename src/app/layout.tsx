import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTimeZone, getTranslations } from "next-intl/server";
import { AppSessionProvider } from "@/components/auth/session-provider";
import { TimeZoneSync } from "@/src/components/i18n/time-zone-sync";
import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/logo.png", type: "image/png", sizes: "500x500" }],
      shortcut: [{ url: "/logo.png", type: "image/png", sizes: "500x500" }],
      apple: { url: "/logo.png", sizes: "500x500" },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, timeZone] = await Promise.all([getLocale(), getTimeZone()]);

  return (
    <html lang={locale}>
      <body className="min-h-screen text-white antialiased">
        <NextIntlClientProvider>
          <TimeZoneSync current={timeZone} />
          <AppSessionProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </AppSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
