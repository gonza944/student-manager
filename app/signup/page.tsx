import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthPage } from "@/components/auth-page";
import { requireRole } from "@/lib/auth/server";
import { getCurrencyGroups } from "@/lib/currencies";

import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Signup");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SignupPage() {
  const session = await requireRole("teacher");
  if ("session" in session) redirect("/");

  const [t, locale] = await Promise.all([
    getTranslations("Signup"),
    getLocale(),
  ]);
  const copy = {
    nameLabel: t("nameLabel"),
    namePlaceholder: t("namePlaceholder"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    currencyLabel: t("currencyLabel"),
    currencyHint: t("currencyHint"),
    currencyPlaceholder: t("currencyPlaceholder"),
    currencyNoResults: t("currencyNoResults"),
    currencyOpen: t("currencyOpen"),
    passwordLabel: t("passwordLabel"),
    passwordPlaceholder: t("passwordPlaceholder"),
    showPassword: t("showPassword"),
    hidePassword: t("hidePassword"),
    continue: t("continue"),
    loading: t("loading"),
    signupFailed: t("signupFailed"),
    invalidName: t("invalidName"),
    invalidEmail: t("invalidEmail"),
    invalidCurrency: t("invalidCurrency"),
    passwordTooShort: t("passwordTooShort"),
    loginPrompt: t("loginPrompt"),
    loginLink: t("loginLink"),
  };

  return (
    <AuthPage eyebrow={t("eyebrow")} title={t("title")}>
      <SignupForm
        copy={copy}
        currencyGroups={getCurrencyGroups(locale, {
          popular: t("currencyGroups.popular"),
          international: t("currencyGroups.international"),
        })}
      />
    </AuthPage>
  );
}
