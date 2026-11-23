import {
  Calendar03Icon,
  CircleDollarSignIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export async function DashboardCards({
  metrics,
  currency,
  timeZone,
}: {
  metrics: Awaited<ReturnType<typeof getTeacherDashboardMetrics>>;
  currency: string;
  timeZone: string;
}) {
  const [t, format, locale] = await Promise.all([
    getTranslations("Dashboard"),
    getFormatter(),
    getLocale(),
  ]);
  const previousMonth = format.dateTime(metrics.previousMonthStart, { month: "long", timeZone });
  const revenue = metrics.revenue.length > 0
    ? metrics.revenue
    : [{ currency, currentMinor: 0, previousMinor: 0 }];

  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label={t("overviewLabel")}>
      <DashboardCard
        title={t("metrics.monthlyRevenue")}
        icon={CircleDollarSignIcon}
        className="bg-orbit-ink text-orbit-paper-strong"
      >
        {revenue.map(({ currency, currentMinor, previousMinor }) => {
          const money = new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay: revenue.length > 1 ? "code" : "symbol",
          });
          const fractionDigits = money.resolvedOptions().maximumFractionDigits ?? 2;

          return (
            <div key={currency} className="space-y-2">
              <p className={valueClassName}>{money.format(currentMinor / 10 ** fractionDigits)}</p>
              {previousMinor > 0 ? (
                <p className="text-sm font-semibold text-yellow-400">
                  {t("metrics.revenueDetail", {
                    percent: format.number((currentMinor - previousMinor) / previousMinor, {
                      style: "percent",
                      signDisplay: "exceptZero",
                    }),
                    month: previousMonth,
                  })}
                </p>
              ) : null}
            </div>
          );
        })}
      </DashboardCard>
      <DashboardCard
        title={t("metrics.activeStudents")}
        icon={UserMultipleIcon}
        className="bg-green-400 text-orbit-ink"
      >
        <p className={valueClassName}>{format.number(metrics.activeStudents)}</p>
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
