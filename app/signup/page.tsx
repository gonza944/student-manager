import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthPage } from "@/components/auth-page";
import { requireRole } from "@/lib/auth/server";

import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Signup");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SignupPage() {
  const session = await requireRole("teacher");
  if ("session" in session) redirect("/");

  const t = await getTranslations("Signup");
  const copy = {
    nameLabel: t("nameLabel"),
    namePlaceholder: t("namePlaceholder"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    passwordLabel: t("passwordLabel"),
    passwordPlaceholder: t("passwordPlaceholder"),
    showPassword: t("showPassword"),
    hidePassword: t("hidePassword"),
    continue: t("continue"),
    loading: t("loading"),
    signupFailed: t("signupFailed"),
    invalidName: t("invalidName"),
    invalidEmail: t("invalidEmail"),
    passwordTooShort: t("passwordTooShort"),
    loginPrompt: t("loginPrompt"),
    loginLink: t("loginLink"),
  };

  return (
    <AuthPage eyebrow={t("eyebrow")} title={t("title")}>
      <SignupForm copy={copy} />
    </AuthPage>
  );
}
