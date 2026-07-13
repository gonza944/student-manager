export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export function getLocale(acceptLanguage: string | null): Locale {
  const languages = (acceptLanguage ?? "")
    .split(",")
    .map((value) => {
      const [language, ...parameters] = value.trim().split(";");
      const quality = parameters.find((parameter) => parameter.startsWith("q="));

      return { language: language?.toLowerCase().split("-")[0], quality: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter(({ language, quality }) => language && Number.isFinite(quality) && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  return (languages.find(({ language }) => locales.includes(language as Locale))?.language as Locale | undefined) ?? defaultLocale;
}
