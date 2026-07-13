import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AuthPage } from "@/components/auth-page";
import { requireRole } from "@/lib/auth/server";

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Login");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function LoginPage() {
  const session = await requireRole("teacher");
  if ("session" in session) redirect("/");

  const t = await getTranslations("Login");
  const copy = {
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    passwordLabel: t("passwordLabel"),
    passwordPlaceholder: t("passwordPlaceholder"),
    showPassword: t("showPassword"),
    hidePassword: t("hidePassword"),
    rememberMe: t("rememberMe"),
    continue: t("continue"),
    loading: t("loading"),
    invalidCredentials: t("invalidCredentials"),
    notTeacher: t("notTeacher"),
    invalidEmail: t("invalidEmail"),
    passwordTooShort: t("passwordTooShort"),
    signupPrompt: t("signupPrompt"),
    signupLink: t("signupLink"),
  };

  return (
    <AuthPage eyebrow={t("eyebrow")} title={t("title")}>
      <LoginForm copy={copy} />
    </AuthPage>
  );
}
