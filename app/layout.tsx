import type { Metadata } from "next";
import "./globals.css";

import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";

export const metadata: Metadata = {
  title: "BilalHocayds AI",
  description: "AI destekli YDS / YOKDIL / YDT hazirlik platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen text-white antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
