"use client";

import { useLocale, useTranslations } from "next-intl";
import { Clock03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import type { StudentClassDto } from "@/lib/classes/contracts";
import type { TimelineOrientation } from "@/components/timeline/layout";

export function ClassSummary({
  studentClass,
  showStudentName,
  timeZone,
  orientation,
  above,
}: {
  studentClass: StudentClassDto;
  showStudentName: boolean;
  timeZone: string;
  orientation: TimelineOrientation;
  above: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Classes");
  const charge = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: studentClass.currency,
    currencyDisplay: "code",
  });
  const fractionDigits = charge.resolvedOptions().maximumFractionDigits ?? 2;
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  return (
    <>
      {showStudentName ? (
        <span className="mb-2 w-full truncate font-bold" title={studentClass.studentName}>
          {studentClass.studentName}
        </span>
      ) : null}
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
            ? "border-destructive/20 bg-destructive/10 text-red-600 dark:text-red-200"
            : undefined
        }
      >
        {t(`statuses.${studentClass.status}`)}
      </Badge>
      <span
        className={`rounded-full border border-border bg-card px-3 py-1.5 text-sm font-bold ${orientation === "horizontal" ? `absolute left-1/2 -translate-x-1/2 whitespace-nowrap ${above ? "-bottom-12" : "-top-12"}` : "mt-3 max-w-full"}`}
      >
        {dateTime.format(new Date(studentClass.scheduledAt))}
      </span>
      <span className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <HugeiconsIcon icon={Clock03Icon} aria-hidden="true" />
        {t("duration", { minutes: studentClass.durationMinutes })}
      </span>
      <span className="mt-2 font-bold">
        {charge.format(studentClass.chargeMinor / 10 ** fractionDigits)}
      </span>
    </>
  );
}
