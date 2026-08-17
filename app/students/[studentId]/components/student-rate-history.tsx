"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  StudentRateHistoryEntry,
  StudentRateHistoryPage,
} from "@/lib/students/contracts";

import { useStudentRateHistory } from "../../hooks/use-student-rate-history";
import {
  formatDuration,
  rateHistoryColumns,
} from "../../utils/rate-history-display";
import { StudentRateEditor } from "./student-rate-editor";
import { StudentRateDeleteConfirmation } from "./student-rate-delete-confirmation";

export function StudentRateHistory({
  currency,
  initialData,
  onCurrentRateChange,
  studentId,
  timeZone,
}: {
  currency: string;
  initialData: StudentRateHistoryPage;
  onCurrentRateChange: (rate: StudentRateHistoryEntry) => void;
  studentId: string;
  timeZone: string;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const [rateToDelete, setRateToDelete] =
    useState<StudentRateHistoryEntry | null>(null);
  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale],
  );
  const signedMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        signDisplay: "always",
      }),
    [currency, locale],
  );
  const percent = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone,
      }),
    [locale, timeZone],
  );
  const fractionDigits = money.resolvedOptions().maximumFractionDigits ?? 2;
  const minorFactor = 10 ** fractionDigits;
  const formatMoney = (minor: number) => money.format(minor / minorFactor);
  const {
    currentRate,
    deleteMutation,
    entries,
    hasNextPage,
    isError,
    isFetchingNextPage,
    rowVirtualizer,
    viewportRef,
    virtualRows,
  } = useStudentRateHistory({
    initialData,
    onCurrentRateChange,
    studentId,
  });
  const firstVirtualRow = virtualRows[0];
  return (
    <Card className="gap-0 overflow-hidden border-orbit-ink/20 bg-paper-strong py-0 shadow-none lg:col-span-12">
        <CardHeader className="flex flex-row items-center gap-3 px-5 py-3 sm:px-6">
          <CardTitle className="text-2xl font-black tracking-[-0.04em]">
            <h2>{t("profile.rateHistory.title")}</h2>
          </CardTitle>
          <StudentRateEditor
            currency={currency}
            fractionDigits={fractionDigits}
            grossMinor={currentRate.grossMinor}
            initialSource={currentRate.source}
            studentId={studentId}
            timeZone={timeZone}
          />
        </CardHeader>

        <CardContent className="px-0">
          <div
            ref={viewportRef}
            className="max-h-[70dvh] overflow-auto overscroll-contain"
            tabIndex={0}>
            <table className="w-full min-w-280 border-collapse text-sm">
              <caption className="sr-only">
                {t("profile.rateHistory.caption")}
              </caption>
              <thead className="sticky top-0 z-10 bg-paper-strong">
                <tr className="border-y border-orbit-ink/15 text-muted-foreground shadow-[0_1px_0_rgb(22_22_22/0.15)]">
                  {rateHistoryColumns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap px-4 py-2 text-start text-label font-bold uppercase tracking-widest first:ps-5 last:pe-5 sm:first:ps-6 sm:last:pe-6">
                      {t(`profile.rateHistory.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firstVirtualRow?.start ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={rateHistoryColumns.length}
                      className="p-0"
                      style={{ height: firstVirtualRow.start }}
                    />
                  </tr>
                ) : null}
                {virtualRows.map((virtualRow) => {
                  const entry = entries[virtualRow.index];
                  const index = virtualRow.index;
                  const current = index === 0;
                  const canDelete = hasNextPage || index < entries.length - 1;
                  const startDate = date.format(new Date(entry.effectiveAt));

                  return (
                    <tr
                      key={virtualRow.key}
                      className={
                        current
                          ? "h-14 border-b border-orbit-ink/15 bg-orbit-ink text-orbit-paper-strong"
                          : "h-14 border-b border-orbit-ink/15 bg-paper-strong text-orbit-ink"
                      }>
                      <th
                        scope="row"
                        className="whitespace-nowrap py-3 pe-4 ps-5 text-start font-black sm:ps-6">
                        {current ? (
                          <span className="sr-only">
                            {t("profile.rateHistory.current")}: {" "}
                          </span>
                        ) : null}
                        {t(`sources.${entry.source}`)}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 font-bold">
                        {formatMoney(entry.grossMinor)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold">
                        {formatMoney(entry.feeMinor)} {" "}
                        <span
                          className={
                            current
                              ? "text-orbit-paper-strong/65"
                              : "text-muted-foreground"
                          }>
                          ({percent.format(entry.feeBps / 10_000)})
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-black">
                        {formatMoney(entry.netMinor)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold">
                        {entry.differenceFromPreviousMinor === null
                          ? "—"
                          : signedMoney.format(
                              entry.differenceFromPreviousMinor / minorFactor,
                            )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDuration(entry.durationMs, locale)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {startDate}
                      </td>
                      <td className="whitespace-nowrap py-3 pe-5 ps-4 sm:pe-6">
                        {entry.effectiveUntil
                          ? date.format(
                              new Date(
                                new Date(entry.effectiveUntil).getTime() - 1,
                              ),
                            )
                          : t("profile.rateHistory.ongoing")}
                      </td>
                      <td className="whitespace-nowrap py-2 pe-5 ps-4 text-end sm:pe-6">
                        {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={deleteMutation.isPending}
                            aria-label={t("profile.rateHistory.delete", {
                              date: startDate,
                            })}
                            className="size-10 rounded-full"
                            onClick={() => {
                              deleteMutation.reset();
                              setRateToDelete(entry);
                            }}>
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={20}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {virtualRows.length ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={rateHistoryColumns.length}
                      className="p-0"
                      style={{
                        height:
                          rowVirtualizer.getTotalSize() -
                          virtualRows[virtualRows.length - 1].end,
                      }}
                    />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {isFetchingNextPage ? (
            <p
              className="border-t border-orbit-ink/15 px-5 py-3 text-center text-sm font-bold text-muted-foreground sm:px-6"
              role="status">
              {t("profile.rateHistory.loadingMore")}
            </p>
          ) : null}
          {isError ? (
            <p
              className="border-t border-orbit-ink/15 px-5 py-3 text-sm font-bold text-destructive sm:px-6"
              role="alert">
              {t("profile.rateHistory.loadError")}
            </p>
          ) : null}
        </CardContent>
        <StudentRateDeleteConfirmation
          open={rateToDelete !== null}
          pending={deleteMutation.isPending}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) setRateToDelete(null);
          }}
          onConfirm={() => {
            if (rateToDelete) {
              setRateToDelete(null);
              deleteMutation.mutate(rateToDelete.id);
            }
          }}
        />
    </Card>
  );
}
