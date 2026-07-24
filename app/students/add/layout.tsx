import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default async function AddStudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("Students");

  return (
    <main className="min-h-dvh bg-background">
      <nav
        aria-label={t("form.navigation")}
        className="mx-auto flex w-full items-center gap-2 px-4 py-4 sm:px-6 lg:px-10">
        <Button asChild variant="ghost">
          <Link href="/">{t("backToDashboard")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/students">{t("directory")}</Link>
        </Button>
      </nav>
      <div className="pb-0 sm:px-6 sm:pb-8 lg:px-10">{children}</div>
    </main>
  );
}
