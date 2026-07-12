import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit — Student Studio",
  description: "A calm dashboard for independent teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
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
