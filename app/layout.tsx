import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";

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
      </head>
      <body className="min-h-full font-sans">
        <Script id="restore-color-theme" strategy="beforeInteractive">
          {`(() => {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
            function syncTheme() {
              let savedTheme;
              try { savedTheme = localStorage.getItem("theme"); } catch {}
              const dark = savedTheme === "dark" || (savedTheme !== "light" && systemTheme.matches);
              document.documentElement.classList.toggle("dark", dark);
            }
            syncTheme();
            systemTheme.addEventListener("change", syncTheme);
          })();`}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
