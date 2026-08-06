import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default async function EditStudentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const [{ studentId }, t] = await Promise.all([
    params,
    getTranslations("Students"),
  ]);

  return (
    <main className="min-h-dvh bg-background">
      <nav
        aria-label={t("edit.navigation")}
        className="mx-auto flex w-full items-center gap-2 px-4 py-4 sm:px-6 lg:px-10">
        <Button asChild variant="ghost">
          <Link href="/students">{t("directory")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/students/${studentId}`}>{t("edit.profile")}</Link>
        </Button>
      </nav>
      <div className="pb-0 sm:px-6 sm:pb-8 lg:px-10">{children}</div>
    </main>
  );
}
