"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudentRateTimeline } from "@/lib/students/contracts";

import {
  formatDuration,
  rateHistoryColumns,
} from "../../utils/rate-history-display";
import { StudentRateEditor } from "./student-rate-editor";

export function StudentRateHistory({
  currency,
  hasOlderHistory,
  studentId,
  timeline,
}: {
  currency: string;
  hasOlderHistory: boolean;
  studentId: string;
  timeline: StudentRateTimeline;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
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
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );
  const fractionDigits = money.resolvedOptions().maximumFractionDigits ?? 2;
  const minorFactor = 10 ** fractionDigits;
  const formatMoney = (minor: number) => money.format(minor / minorFactor);

  return (
    <Card className="gap-0 overflow-hidden border-orbit-ink/20 bg-paper-strong py-0 shadow-none lg:col-span-12">
        <CardHeader className="flex flex-row items-center gap-3 px-5 py-3 sm:px-6">
          <CardTitle className="text-2xl font-black tracking-[-0.04em]">
            <h2>{t("profile.rateHistory.title")}</h2>
          </CardTitle>
          <StudentRateEditor
            currency={currency}
            fractionDigits={fractionDigits}
            grossMinor={timeline.current.grossMinor}
            initialSource={timeline.current.source}
            studentId={studentId}
          />
        </CardHeader>

        <CardContent className="px-0">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-280 border-collapse text-sm">
              <caption className="sr-only">
                {t("profile.rateHistory.caption")}
              </caption>
              <thead>
                <tr className="border-y border-orbit-ink/15 text-muted-foreground">
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
              <tbody className="divide-y divide-orbit-ink/15">
                {[timeline.current, ...timeline.previous].map((entry, index) => {
                  const current = index === 0;

                  return (
                    <tr
                      key={entry.id}
                      className={
                        current
                          ? "bg-orbit-ink text-orbit-paper-strong"
                          : "bg-paper-strong text-orbit-ink"
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
                        {date.format(new Date(entry.effectiveAt))}
                      </td>
                      <td className="whitespace-nowrap py-3 pe-5 ps-4 sm:pe-6">
                        {entry.effectiveUntil
                          ? date.format(new Date(entry.effectiveUntil))
                          : t("profile.rateHistory.ongoing")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasOlderHistory ? (
            <p className="border-t border-orbit-ink/15 px-5 py-3 text-sm text-muted-foreground sm:px-6">
              {t("profile.rateHistory.olderEntriesOmitted")}
            </p>
          ) : null}
        </CardContent>
    </Card>
  );
}
