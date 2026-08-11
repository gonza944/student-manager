"use client";

import {
  ArrowLeft01Icon,
  BookOpen02Icon,
  Calendar03Icon,
  Clock03Icon,
  Delete02Icon,
  Message01Icon,
  PencilEdit01Icon,
  UserCheck01Icon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Marquee,
  MarqueeContent,
  MarqueeItem,
} from "@/components/kibo-ui/marquee";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudentProfile as StudentProfileData } from "@/lib/students/contracts";
import { cn } from "@/lib/utils";

import { deleteStudentAction, setStudentActiveAction } from "../../actions";
import { DeleteStudentConfirmation } from "../../components/delete-student-confirmation";
import {
  studentThemeStyles,
  studentThemeSwatches,
} from "../../const/student-card-config";
import { ProfileCardHeader } from "./profile-card-header";
import { ProfileDetail } from "./profile-detail";
import { ProfileTags } from "./profile-tags";
import { StudentRateHistory } from "./student-rate-history";

export function StudentProfile({ profile }: { profile: StudentProfileData }) {
  const { student, currency } = profile;
  const t = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();
  const [isActive, setIsActive] = useState(student.isActive);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const countryName = useMemo(
    () =>
      new Intl.DisplayNames(locale, { type: "region" }).of(
        student.nationalityCode,
      ) ?? student.nationalityCode,
    [locale, student.nationalityCode],
  );
  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeStyle: "short",
      }),
    [locale],
  );
  const dateOnly = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeZone: "UTC",
      }),
    [locale],
  );
  const formatMoney = (minor: number) =>
    money.format(
      minor /
        10 ** (money.resolvedOptions().maximumFractionDigits ?? 2),
    );
  const status = isActive ? t("active") : t("inactive");
  const source = t(`sources.${student.source}`);

  const statusMutation = useMutation({
    mutationFn: async (nextIsActive: boolean) => {
      const result = await setStudentActiveAction({
        studentId: student.id,
        isActive: nextIsActive,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onMutate: (nextIsActive) => {
      const previousIsActive = isActive;
      setIsActive(nextIsActive);
      return { previousIsActive };
    },
    onError: (_error, _nextIsActive, context) => {
      setIsActive(context?.previousIsActive ?? student.isActive);
      toast.error(t("profile.statusError"));
    },
    onSuccess: () => {
      toast.success(t("profile.statusSuccess"));
      router.refresh();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteStudentAction({ studentId: student.id });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onError: () => {
      toast.error(t("profile.deleteError"));
    },
    onSuccess: () => router.replace("/students"),
  });
  const pending = statusMutation.isPending || deleteMutation.isPending;

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-360">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label={t("profile.navigation")}>
            <Button asChild variant="ghost" className="min-h-12 rounded-full">
              <Link href="/students">
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("profile.back")}
              </Link>
            </Button>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              className="min-h-12 rounded-full">
              <Link href={`/students/edit/${student.id}`}>
                <HugeiconsIcon
                  icon={PencilEdit01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("edit.action")}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => statusMutation.mutate(!isActive)}
              className="min-h-12 rounded-full">
              <HugeiconsIcon
                icon={isActive ? UserMinus01Icon : UserCheck01Icon}
                strokeWidth={2}
                aria-hidden="true"
              />
              {isActive ? t("deactivate") : t("activate")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => setDeleteOpen(true)}
              className="min-h-12 rounded-full">
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("delete")}
            </Button>
          </div>
        </header>

        <section
          className="pb-8 pt-14 sm:pt-20"
          aria-labelledby="student-profile-name">
          <p className="mb-4 text-caption font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {t("profile.eyebrow")}
          </p>
          <h1
            id="student-profile-name"
            className="max-w-6xl text-balance text-[clamp(3.25rem,9vw,8rem)] font-black leading-[0.82] tracking-[-0.09em]">
            {student.name}
          </h1>
        </section>

        <Marquee
          className={cn(
            "rounded-xl border border-orbit-ink/15 py-3 text-orbit-ink",
            isActive
              ? studentThemeSwatches[student.themeColor]
              : "bg-blue-gray-400",
          )}>
          <span className="sr-only">
            {student.level}, {countryName}, {source}, {status}
          </span>
          <MarqueeContent aria-hidden="true" speed={30}>
            {[
              { key: "level", content: student.level },
              { key: "country", content: countryName },
              { key: "source", content: source },
              {
                key: "status",
                content: (
                <Badge
                  variant={isActive ? "success" : "outline"}
                  className="border-orbit-ink/20 px-3 py-1 text-caption font-black uppercase tracking-widest">
                  {status}
                </Badge>
                ),
              },
            ].map((item) => (
              <MarqueeItem
                key={item.key}
                className="flex items-center gap-4 text-sm font-black uppercase tracking-[0.12em]">
                {item.content}
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-orbit-ink/70"
                />
              </MarqueeItem>
            ))}
          </MarqueeContent>
        </Marquee>

        <section
          aria-label={t("profile.details")}
          className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card
            className={cn(
              "relative min-h-128 overflow-hidden border-none bg-linear-to-br p-0 text-orbit-ink shadow-none lg:col-span-5 lg:row-span-2",
              studentThemeStyles[student.themeColor],
              isActive ? "" : "grayscale",
            )}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgb(255_255_255/0.4),transparent_65%)]" />
            <Image
              src={`/avatars/open-peeps/${student.avatarKey}.svg`}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-contain object-center p-6 sm:p-10"
            />
          </Card>

          <Card className="border-orbit-ink/20 bg-yellow-400 text-orbit-ink shadow-none lg:col-span-5">
            <ProfileCardHeader title={t("profile.groups.personal")} />
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8">
                <ProfileDetail label={t("profile.fields.name")}>
                  {student.name}
                </ProfileDetail>
                <ProfileDetail label={t("profile.fields.nationality")}>
                  {countryName}
                </ProfileDetail>
                {student.birthDate ? (
                  <ProfileDetail label={t("profile.fields.birthDate")}>
                    {dateOnly.format(new Date(`${student.birthDate}T00:00:00Z`))}
                  </ProfileDetail>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card className="aspect-square border-orbit-paper-strong/20 bg-orbit-ink text-orbit-paper-strong shadow-none lg:col-span-2">
            <CardHeader className="px-5">
              <CardDescription className="text-label font-bold uppercase tracking-[0.12em] text-current opacity-65">
                {t("hourlyRate")}
              </CardDescription>
              <CardTitle className="text-2xl font-black tracking-tighter sm:text-3xl">
                <h2>{source}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-label font-bold uppercase tracking-widest opacity-65">
                    {t("grossRate")}
                  </dt>
                  <dd className="mt-1 text-lg font-black tracking-tighter">
                    {formatMoney(student.rates.grossMinor)}
                  </dd>
                </div>
                <div>
                  <dt className="text-label font-bold uppercase tracking-widest opacity-65">
                    {t("platformFee")}
                  </dt>
                  <dd className="mt-1 text-lg font-black tracking-tighter">
                    {formatMoney(student.rates.platformFeeMinor)}
                  </dd>
                </div>
                <div>
                  <dt className="text-label font-bold uppercase tracking-widest opacity-65">
                    {t("netRate")}
                  </dt>
                  <dd className="mt-1 text-2xl font-black tracking-tighter">
                    {formatMoney(student.rates.netMinor)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-orbit-ink/20 bg-paper-strong shadow-none lg:col-span-7">
            <ProfileCardHeader
              title={t("profile.groups.contact")}
              icon={Message01Icon}
            />
            <CardContent>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                {student.email ? (
                  <ProfileDetail label={t("profile.fields.email")}>
                    <a
                      className="underline underline-offset-4"
                      href={`mailto:${student.email}`}>
                      {student.email}
                    </a>
                  </ProfileDetail>
                ) : null}
                {student.phone ? (
                  <ProfileDetail label={t("profile.fields.phone")}>
                    <a
                      className="underline underline-offset-4"
                      href={`tel:${student.phone}`}>
                      {student.phone}
                    </a>
                  </ProfileDetail>
                ) : null}
                <ProfileDetail label={t("profile.fields.timeZone")}>
                  {student.timeZone}
                </ProfileDetail>
                <ProfileDetail label={t("profile.fields.preferredContact")}>
                  {t(`contactChannels.${student.preferredContactChannel}`)}
                </ProfileDetail>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-orbit-ink/20 bg-blue-gray-400 text-orbit-ink shadow-none lg:col-span-12">
            <ProfileCardHeader
              title={t("profile.groups.learning")}
              icon={BookOpen02Icon}
            />
            <CardContent>
              <div className="grid gap-x-8 md:grid-cols-3">
                <dl>
                  <ProfileDetail label={t("profile.fields.level")}>
                    {student.level}
                  </ProfileDetail>
                  {student.preferences.length ? (
                    <ProfileDetail label={t("profile.fields.preferences")}>
                      <ProfileTags values={student.preferences} />
                    </ProfileDetail>
                  ) : null}
                </dl>

                {student.interests.length || student.learningGoals ? (
                  <dl>
                    {student.interests.length ? (
                      <ProfileDetail label={t("profile.fields.interests")}>
                        <ProfileTags values={student.interests} />
                      </ProfileDetail>
                    ) : null}
                    {student.learningGoals ? (
                      <ProfileDetail label={t("profile.fields.goals")}>
                        <span className="whitespace-pre-wrap text-base font-semibold leading-relaxed sm:text-lg">
                          {student.learningGoals}
                        </span>
                      </ProfileDetail>
                    ) : null}
                  </dl>
                ) : null}

                <dl className="md:col-start-3">
                  <ProfileDetail label={t("profile.fields.createdAt")}>
                    <span className="inline-flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        aria-hidden="true"
                      />
                      {date.format(new Date(student.createdAt))}
                    </span>
                  </ProfileDetail>
                  <ProfileDetail label={t("profile.fields.updatedAt")}>
                    <span className="inline-flex items-center gap-2">
                      <HugeiconsIcon icon={Clock03Icon} aria-hidden="true" />
                      {date.format(new Date(student.updatedAt))}
                    </span>
                  </ProfileDetail>
                </dl>
              </div>
            </CardContent>
          </Card>

          <StudentRateHistory
            currency={currency}
            studentId={student.id}
            timeline={profile.rateTimeline}
          />
        </section>

        <DeleteStudentConfirmation
          name={student.name}
          open={deleteOpen}
          pending={deleteMutation.isPending}
          onOpenChange={(open) => {
            if (!deleteMutation.isPending) setDeleteOpen(open);
          }}
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>
    </main>
  );
}
