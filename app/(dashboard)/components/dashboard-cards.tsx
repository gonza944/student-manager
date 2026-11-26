import {
  Calendar03Icon,
  CircleDollarSignIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { getTeacherDashboardMetrics } from "@/lib/dashboard/metrics";
import { cn } from "@/lib/utils";

function DashboardCard({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon: IconSvgElement;
  className: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("min-w-0 justify-between rounded-[var(--radius)] shadow-none", className)}>
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-[0.14em]">
          <h2>{title}</h2>
        </CardTitle>
        <CardAction className="grid size-10 place-items-center rounded-full border border-current/25">
          <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

const valueClassName = "break-words text-4xl font-black tracking-tight tabular-nums";
const revenueSources = ["preply", "private"] as const;
const emptyRevenueBySource = { preply: 0, private: 0 };

function RevenueAmount({
  label,
  amount,
  breakdown,
  className,
}: {
  label: string;
  amount: string;
  breakdown: { label: string; amount: string }[];
  className: string;
}) {
  return (
    <dd className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-block max-w-full cursor-help rounded-sm underline decoration-dotted decoration-1 decoration-current/50 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {amount}
          </span>
        </TooltipTrigger>
        <TooltipContent align="start" sideOffset={6} className="shadow-md ring-1 ring-current/20">
          <span className="grid gap-1">
            <span className="font-semibold">{label}</span>
            {breakdown.map((source) => (
              <span key={source.label} className="flex justify-between gap-4">
                <span>{source.label}</span>{" "}
                <span className="tabular-nums whitespace-nowrap">{source.amount}</span>
              </span>
            ))}
          </span>
        </TooltipContent>
      </Tooltip>
    </dd>
  );
}

export async function DashboardCards({
  metrics,
  activeStudentCount,
  currency,
  timeZone,
}: {
  metrics: Awaited<ReturnType<typeof getTeacherDashboardMetrics>>;
  activeStudentCount: number;
  currency: string;
  timeZone: string;
}) {
  const [t, sourceT, format, locale] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Students.sources"),
    getFormatter(),
    getLocale(),
  ]);
  const previousMonth = format.dateTime(metrics.previousMonthStart, { month: "long", timeZone });
  const revenue = metrics.revenue.length > 0
    ? metrics.revenue
    : [{
        currency,
        currentGrossMinor: 0,
        currentNetMinor: 0,
        currentGrossMinorBySource: emptyRevenueBySource,
        currentNetMinorBySource: emptyRevenueBySource,
        previousGrossMinor: 0,
      }];
  const netLabel = t("metrics.netRevenue");
  const grossLabel = t("metrics.grossRevenue");

  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label={t("overviewLabel")}>
      <DashboardCard
        title={t("metrics.monthlyRevenue")}
        icon={CircleDollarSignIcon}
        className="bg-orbit-ink text-orbit-paper-strong"
      >
        <TooltipProvider>
          {revenue.map(({
            currency,
            currentGrossMinor,
            currentNetMinor,
            currentGrossMinorBySource,
            currentNetMinorBySource,
            previousGrossMinor,
          }) => {
            const money = new Intl.NumberFormat(locale, {
              style: "currency",
              currency,
              currencyDisplay: revenue.length > 1 ? "code" : "symbol",
            });
            const divisor = 10 ** (money.resolvedOptions().maximumFractionDigits ?? 2);
            const formatMoney = (minor: number) => money.format(minor / divisor);
            const formatBreakdown = (sourceAmounts: typeof emptyRevenueBySource) =>
              revenueSources.map((source) => ({
                label: sourceT(source),
                amount: formatMoney(sourceAmounts[source]),
              }));

            return (
              <dl key={currency} className="space-y-3 border-current/25 not-first:border-t not-first:pt-3">
                <div>
                  <dt className="text-sm font-semibold">{netLabel}</dt>
                  <RevenueAmount
                    label={netLabel}
                    amount={formatMoney(currentNetMinor)}
                    breakdown={formatBreakdown(currentNetMinorBySource)}
                    className={valueClassName}
                  />
                </div>
                <div>
                  <dt className="text-sm font-semibold">{grossLabel}</dt>
                  <RevenueAmount
                    label={grossLabel}
                    amount={formatMoney(currentGrossMinor)}
                    breakdown={formatBreakdown(currentGrossMinorBySource)}
                    className="break-words text-xl font-bold tabular-nums"
                  />
                  {previousGrossMinor > 0 ? (
                    <dd className="text-sm font-semibold text-yellow-400">
                      {t("metrics.revenueDetail", {
                        percent: format.number((currentGrossMinor - previousGrossMinor) / previousGrossMinor, {
                          style: "percent",
                          signDisplay: "exceptZero",
                        }),
                        month: previousMonth,
                      })}
                    </dd>
                  ) : null}
                </div>
              </dl>
            );
          })}
        </TooltipProvider>
      </DashboardCard>
      <DashboardCard
        title={t("metrics.activeStudents")}
        icon={UserMultipleIcon}
        className="bg-green-400 text-orbit-ink"
      >
        <p className={valueClassName}>{format.number(activeStudentCount)}</p>
        <p className="text-sm font-semibold">
          {t("metrics.activeDetail", { count: metrics.newStudentsThisMonth })}
        </p>
      </DashboardCard>
      <DashboardCard
        title={t("metrics.classesThisMonth")}
        icon={Calendar03Icon}
        className="bg-blue-gray-400 text-orbit-ink"
      >
        <p className={valueClassName}>{format.number(metrics.classesThisMonth)}</p>
        <p className="text-sm font-semibold">{t("metrics.classesDetail", { count: metrics.classesToday })}</p>
      </DashboardCard>
    </section>
  );
}
