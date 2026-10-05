"use client";

import {
  Add01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock03Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentClassDto } from "@/lib/classes/contracts";

import { DeleteClassConfirmation } from "./delete-class-confirmation";

function formatCharge(studentClass: StudentClassDto, locale: string) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: studentClass.currency,
    currencyDisplay: "code",
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(studentClass.chargeMinor / 10 ** fractionDigits);
}

export function ClassPreviewList({
  classes,
  studentId,
  studentIsActive,
  timeZone,
}: {
  classes: StudentClassDto[];
  studentId: string;
  studentIsActive: boolean;
  timeZone: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Classes");
  const [visibleClasses, setVisibleClasses] = useState(classes);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }),
    [locale, timeZone],
  );

  return (
    <section className="mt-4" aria-labelledby="classes-title">
      <Card className="border-orbit-ink/20 bg-paper-strong shadow-none">
        <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
          <CardTitle id="classes-title" className="text-2xl font-black">
            <h2>{t("title")}</h2>
          </CardTitle>
          {studentIsActive ? (
            <Button asChild className="min-h-12 rounded-full">
              <Link href={`/students/${studentId}/classes/add`}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
                {t("actions.add")}
              </Link>
            </Button>
          ) : (
            <Button disabled className="min-h-12 rounded-full">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
              {t("actions.add")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-3">
            {visibleClasses.map((studentClass) => (
              <li key={studentClass.id}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex min-h-40 w-full flex-col items-start rounded-2xl border border-orbit-ink/15 p-4 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Badge
                        variant={
                          studentClass.status === "completed"
                            ? "success"
                            : studentClass.status === "cancelled"
                              ? "destructive"
                              : "outline"
                        }
                        className={
                          studentClass.status === "cancelled"
                            ? "border border-destructive/20 bg-destructive/10 text-destructive"
                            : studentClass.status === "scheduled"
                              ? "border-orbit-ink/30 bg-transparent text-orbit-ink"
                              : undefined
                        }>
                        {t(`statuses.${studentClass.status}`)}
                      </Badge>
                      <span className="mt-5 font-bold">
                        {dateTime.format(new Date(studentClass.scheduledAt))}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon icon={Clock03Icon} aria-hidden="true" />
                        {t("duration", { minutes: studentClass.durationMinutes })}
                      </span>
                      <span className="mt-3 font-bold">
                        {formatCharge(studentClass, locale)}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 p-2">
                    <DropdownMenuItem asChild className="py-2">
                      <Link href={`/students/${studentId}/classes/${studentClass.id}/edit`}>
                        <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} aria-hidden="true" />
                        {t("actions.edit")}
                      </Link>
                    </DropdownMenuItem>
                    {studentClass.status !== "completed" ? (
                      <DropdownMenuItem
                        className="py-2"
                        onSelect={() =>
                          setVisibleClasses((current) =>
                            current.map((item) =>
                              item.id === studentClass.id
                                ? { ...item, status: "completed" }
                                : item,
                            ),
                          )
                        }>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} aria-hidden="true" />
                        {t("actions.complete")}
                      </DropdownMenuItem>
                    ) : null}
                    {studentClass.status !== "cancelled" ? (
                      <DropdownMenuItem
                        className="py-2"
                        onSelect={() =>
                          setVisibleClasses((current) =>
                            current.map((item) =>
                              item.id === studentClass.id
                                ? { ...item, status: "cancelled" }
                                : item,
                            ),
                          )
                        }>
                        <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} aria-hidden="true" />
                        {t("actions.cancel")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      variant="destructive"
                      className="py-2"
                      onSelect={() => setClassToDelete(studentClass.id)}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <DeleteClassConfirmation
        open={classToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setClassToDelete(null);
        }}
        onConfirm={() => {
          setVisibleClasses((current) =>
            current.filter((item) => item.id !== classToDelete),
          );
          setClassToDelete(null);
        }}
      />
    </section>
  );
}
