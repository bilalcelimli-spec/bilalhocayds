import "./globals.css";
import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/auth/session-provider";
import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";

export const metadata: Metadata = {
  title: "Bilal Hoca YDS",
  description: "AI destekli YDS / YÖKDİL / YDT hazırlık platformu",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "500x500" },
    ],
    apple: { url: "/logo.png", sizes: "500x500" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen text-white antialiased">
        <AppSessionProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AppSessionProvider>
      </body>
    </html>
  );
}