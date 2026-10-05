import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export async function ClassPage({
  children,
  studentId,
}: {
  children: ReactNode;
  studentId: string;
}) {
  const t = await getTranslations("Classes");

  return (
    <main className="min-h-dvh bg-background px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <nav aria-label={t("navigation")} className="mx-auto mb-4 max-w-4xl">
        <Button asChild variant="ghost" className="min-h-12 rounded-full">
          <Link href={`/students/${studentId}`}>{t("actions.backToProfile")}</Link>
        </Button>
      </nav>
      <Card className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-paper-strong p-0">
        {children}
      </Card>
    </main>
  );
}
