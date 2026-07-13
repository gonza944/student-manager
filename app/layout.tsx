import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <Script id="orbit-theme" strategy="beforeInteractive">
          {`try{const saved=localStorage.getItem("theme");const dark=saved?saved==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",dark);document.querySelector('meta[name="color-scheme"]').content=dark?"dark":"light"}catch{}`}
        </Script>
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
