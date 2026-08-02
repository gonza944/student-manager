"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StudentCardDto } from "@/lib/students/contracts";
import { cn } from "@/lib/utils";

import { StudentActionsMenu } from "./student-actions-menu";
import { studentThemeStyles } from "../const/student-card-config";

type StudentCardData = Omit<StudentCardDto, "id">;

export function StudentCard({
  student,
  formatMoney,
  onStatusChange,
  onDelete,
  pending,
  href,
  preview = false,
}: {
  student: StudentCardData;
  formatMoney: (minor: number) => string;
  onStatusChange?: () => void;
  onDelete?: () => void;
  pending?: boolean;
  href?: string;
  preview?: boolean;
}) {
  const t = useTranslations("Students");

  return (
    <article
      className={cn(
        "transition-[filter,opacity] duration-300",
        student.isActive ? "" : "opacity-55 grayscale",
      )}>
      <Card
        className={cn(
          "relative isolate h-(--student-card-height,25rem) w-full gap-0 overflow-hidden bg-linear-to-b p-0 text-orbit-ink border-none",
          studentThemeStyles[student.themeColor],
        )}>
        {href ? (
          <Link
            href={href}
            prefetch={false}
            className="absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-orbit-ink/70 focus-visible:ring-inset">
            <span className="sr-only">
              {t("openProfile", { name: student.name })}
            </span>
          </Link>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgb(255_255_255/0.3),transparent_68%)]" />
          <Image
            src={`/avatars/open-peeps/${student.avatarKey}.svg`}
            alt=""
            fill
            sizes="18rem"
            className="object-contain object-top p-3"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
          <div className="flex gap-1">
            <Badge className="border-orbit-ink/15 bg-orbit-paper-strong/70 text-orbit-ink backdrop-blur-sm">
              {t(`sources.${student.source}`)}
            </Badge>
            <Badge className="border-orbit-ink/15 bg-orbit-paper-strong/75 text-orbit-ink">
              {student.level}
            </Badge>
          </div>
          {preview || !onStatusChange || !onDelete ? null : (
            <div className="pointer-events-auto">
              <StudentActionsMenu
                name={student.name}
                isActive={student.isActive}
                pending={pending ?? false}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>

        <CardContent className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-baseline justify-between gap-3 p-5 sm:p-6">
          <h2 className="text-balance text-2xl font-black">{student.name}</h2>
          <p className="shrink-0 text-lg font-semibold">
            {formatMoney(student.rates.grossMinor)}
          </p>
        </CardContent>
      </Card>
    </article>
  );
}
