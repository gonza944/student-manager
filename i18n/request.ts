import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

import { getLocale } from "./config";

const messages = {
  es: () => import("@/messages/es.json"),
  en: () => import("@/messages/en.json"),
};

export default getRequestConfig(async () => {
  const locale = getLocale((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await messages[locale]()).default,
    timeZone: "America/Argentina/Cordoba",
  };
});
