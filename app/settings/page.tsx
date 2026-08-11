import { ArrowLeft01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/server";
import { teacherRateSettingsSchema } from "@/lib/students/contracts";

import { SettingsForm } from "./components/settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Settings");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SettingsPage() {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const t = await getTranslations("Settings");
  const settings = teacherRateSettingsSchema.parse(auth.session.user);

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <nav aria-label={t("navigation")}>
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/">
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("back")}
            </Link>
          </Button>
        </nav>

        <header className="pb-10 pt-14 sm:pt-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="text-balance text-[clamp(3rem,7vw,6rem)] font-black leading-[0.84] tracking-[-0.085em]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-sm font-semibold text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </header>

        <Card className="border-orbit-ink/20 bg-paper-strong shadow-none">
          <CardHeader>
            <CardTitle className="text-3xl font-black tracking-[-0.06em]">
              <h2>{t("feesTitle")}</h2>
            </CardTitle>
            <CardAction className="grid size-11 place-items-center rounded-full border border-current/25">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <SettingsForm
              initialPreplyCommissionBps={settings.preplyCommissionBps}
              initialDirectCommissionBps={settings.directCommissionBps}
              copy={{
                preplyLabel: t("preplyLabel"),
                preplyHint: t("preplyHint"),
                directLabel: t("directLabel"),
                directHint: t("directHint"),
                save: t("save"),
                saving: t("saving"),
                success: t("success"),
                error: t("error"),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
