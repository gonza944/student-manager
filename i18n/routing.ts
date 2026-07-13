import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "never",
  localeDetection: true,
  localeCookie: false,
  alternateLinks: false,
});
