import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default async function StudentNotFound() {
  const t = await getTranslations("Students.profile.notFound");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="max-w-lg text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 font-semibold text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild className="mt-8 min-h-12 rounded-full">
          <Link href="/students">
            <HugeiconsIcon
              data-icon="inline-start"
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("back")}
          </Link>
        </Button>
      </div>
    </main>
  );
}
