import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowUpRight01Icon,
  BookOpen02Icon,
  Calendar03Icon,
  CircleDollarSignIcon,
  Clock03Icon,
  Message01Icon,
  Orbit02Icon,
  TeacherIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const classes = [
  { time: "18:30", student: "Emma Reed", level: "B2", lesson: "speaking", status: "ready" },
  { time: "20:00", student: "Noor Haddad", level: "C1", lesson: "writing", status: "ready" },
  { time: "22:15", student: "Tomás Vega", level: "A2", lesson: "review", status: "draft" },
] as const;

const progress = [
  { initials: "ER", student: "Emma Reed", value: 92, tone: "bg-red-500 text-orbit-paper-strong" },
  { initials: "NH", student: "Noor Haddad", value: 78, tone: "bg-yellow-400 text-orbit-ink" },
  { initials: "LM", student: "Leo Martin", value: 64, tone: "bg-purple-400 text-orbit-ink" },
] as const;

const revenue = [
  { month: 1, amount: 2420, height: "h-[42%]" },
  { month: 2, amount: 2760, height: "h-[55%]" },
  { month: 3, amount: 2580, height: "h-[48%]" },
  { month: 4, amount: 3220, height: "h-[72%]" },
  { month: 5, amount: 3080, height: "h-[68%]" },
  { month: 6, amount: 3840, height: "h-[92%]" },
] as const;

function MetricCard({
  label,
  value,
  detail,
  icon,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: IconSvgElement;
  className: string;
}) {
  return (
    <Card className={cn("min-h-48 justify-between overflow-hidden py-5 shadow-none", className)}>
      <CardHeader className="px-5">
        <CardDescription className="text-current text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
          {label}
        </CardDescription>
        <CardAction className="grid size-10 place-items-center rounded-full border border-current/20">
          <HugeiconsIcon icon={icon} size={21} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="px-5">
        <p className="text-4xl font-black tracking-[-0.08em]">{value}</p>
        <p className="mt-2 text-xs font-semibold opacity-70">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [t, format] = await Promise.all([getTranslations("Dashboard"), getFormatter()]);
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const month = (value: number, style: "long" | "short") =>
    format.dateTime(new Date(Date.UTC(2026, value, 15)), { month: style, timeZone: "UTC" });
  const metrics = [
    {
      label: t("metrics.monthlyRevenue"),
      value: currency(3840),
      detail: t("metrics.revenueDetail", { percent: 0.12, month: month(5, "long") }),
      icon: CircleDollarSignIcon,
      className: "bg-paper-strong",
    },
    {
      label: t("metrics.activeStudents"),
      value: format.number(21),
      detail: t("metrics.activeDetail", { count: 3 }),
      icon: UserMultipleIcon,
      className: "bg-green-400 text-orbit-ink",
    },
    {
      label: t("metrics.hoursTaught"),
      value: format.number(34.5),
      detail: t("metrics.hoursDetail", { count: 6 }),
      icon: Clock03Icon,
      className: "bg-blue-gray-400 text-orbit-ink",
    },
    {
      label: t("metrics.unreadMessages"),
      value: format.number(4, { minimumIntegerDigits: 2 }),
      detail: t("metrics.messagesDetail", { count: 2 }),
      icon: Message01Icon,
      className: "bg-purple-400 text-orbit-ink",
    },
  ];

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[90rem]">
        <header className="flex flex-wrap items-center justify-between gap-4" aria-label={t("headerLabel")}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border-[0.5rem] border-ink" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full border border-ink/15 bg-paper-strong">
                <HugeiconsIcon icon={Orbit02Icon} size={18} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black tracking-[-0.05em]">Orbit</p>
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink/55">{t("studio")}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle label={t("toggleTheme")} />
            <Button asChild className="rounded-full">
              <a href="#today">
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={Calendar03Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {t("viewSchedule")}
              </a>
            </Button>
            <Avatar size="lg" className="ring-1 ring-ink/15">
              <AvatarFallback className="bg-red-500 font-black text-orbit-paper-strong">GA</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <section className="pb-10 pt-16 sm:pt-24 lg:pb-14 lg:pt-32" aria-labelledby="dashboard-title">
          <p className="mb-4 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink/60">
            {t("weekLocation", { week: 28, location: "Córdoba" })}
          </p>
          <h1
            id="dashboard-title"
            className="max-w-6xl text-balance text-[clamp(2.75rem,7vw,7rem)] font-black leading-[0.84] tracking-[-0.085em]"
          >
            {t("title")}
          </h1>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("overviewLabel")}>
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12" aria-label={t("detailsLabel")}>
          <Card
            id="today"
            className="overflow-hidden border-orbit-ink/20 bg-yellow-400 text-orbit-ink shadow-none lg:col-span-7"
          >
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-orbit-ink/65">
                {t("upNext")}
              </CardDescription>
              <CardTitle className="text-3xl font-black tracking-[-0.06em] sm:text-4xl">{t("todaysClasses")}</CardTitle>
              <CardAction className="grid size-11 place-items-center rounded-full border border-orbit-ink/30">
                <HugeiconsIcon icon={TeacherIcon} size={22} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-orbit-ink/25 hover:bg-transparent">
                    <TableHead className="text-orbit-ink/65">{t("table.time")}</TableHead>
                    <TableHead>{t("table.student")}</TableHead>
                    <TableHead>{t("table.lesson")}</TableHead>
                    <TableHead className="text-right">{t("table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((item) => (
                    <TableRow key={item.time} className="border-orbit-ink/25 hover:bg-yellow-300/60">
                      <TableCell className="font-bold">{item.time}</TableCell>
                      <TableCell className="font-bold">{item.student}</TableCell>
                      <TableCell>{item.level} · {t(`lessons.${item.lesson}`)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.status === "ready" ? "success" : "outline"}>
                          {t(`statuses.${item.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-orbit-ink/20 bg-blue-gray-400 text-orbit-ink shadow-none lg:col-span-5">
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-orbit-ink/65">
                {t("studentPulse")}
              </CardDescription>
              <CardTitle className="text-3xl font-black tracking-[-0.06em] sm:text-4xl">{t("everyoneMoving")}</CardTitle>
              <CardAction className="grid size-11 place-items-center rounded-full border border-orbit-ink/25">
                <HugeiconsIcon icon={AnalyticsUpIcon} size={22} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-5">
              {progress.map((student) => (
                <div key={student.student}>
                  <div className="mb-2 flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={cn("font-black", student.tone)}>{student.initials}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-bold">{student.student}</p>
                    <span className="ms-auto text-sm font-black">{format.number(student.value / 100, { style: "percent" })}</span>
                  </div>
                  <Progress
                    value={student.value}
                    aria-label={t("courseProgress", { student: student.student, value: student.value / 100 })}
                    className="bg-orbit-paper-strong/45 [&_[data-slot=progress-indicator]]:bg-orbit-ink"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-orbit-paper-strong/20 bg-orbit-ink text-orbit-paper-strong shadow-none lg:col-span-5">
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue-gray-400">
                {t("monthlyRevenue")}
              </CardDescription>
              <CardTitle className="text-5xl font-black tracking-[-0.09em]">{currency(3840)}</CardTitle>
              <CardAction>
                <Badge className="bg-green-400 text-green-800">+{format.number(0.12, { style: "percent" })}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex h-36 items-end gap-2" aria-hidden="true">
                {revenue.map((item, index) => (
                  <span
                    key={item.month}
                    className={cn(
                      "min-w-2 flex-1 rounded-t-md bg-blue-gray-600",
                      item.height,
                      index === revenue.length - 1 ? "bg-yellow-400" : "",
                    )}
                  />
                ))}
              </div>
              <table className="sr-only">
                <caption>{t("revenueCaption")}</caption>
                <tbody>
                  {revenue.map((item) => (
                    <tr key={item.month}>
                      <th scope="row">{month(item.month, "long")}</th>
                      <td>{currency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex justify-between text-[0.625rem] font-bold uppercase tracking-[0.08em] text-blue-gray-400" aria-hidden="true">
                {revenue.map((item) => (
                  <span key={item.month}>{month(item.month, "short")}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-ink/20 bg-paper-strong shadow-none lg:col-span-3">
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">{t("needsAttention")}</CardDescription>
              <CardAction className="text-red-500">
                <HugeiconsIcon icon={Alert02Icon} size={22} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-black">Maya Chen</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("noCredits")}</p>
              </div>
              <Separator />
              <div>
                <p className="font-black">Leo Martin</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("homeworkOverdue", { count: 3 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-ink/20 bg-paper-strong shadow-none lg:col-span-4">
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">{t("inbox")}</CardDescription>
              <CardTitle className="text-2xl font-black tracking-[-0.05em]">{t("inboxTitle")}</CardTitle>
              <CardAction className="grid size-10 place-items-center rounded-full bg-purple-400 text-orbit-ink">
                <span className="font-black">{format.number(4, { minimumIntegerDigits: 2 })}</span>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback className="bg-red-500 font-black text-orbit-paper-strong">ER</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-black">Emma Reed</p>
                  <p lang="en" className="mt-1 text-sm text-muted-foreground">The speaking prompts were perfect—thank you!</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-gray-600 font-black text-orbit-paper-strong">NH</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-black">Noor Haddad</p>
                  <p lang="en" className="mt-1 text-sm text-muted-foreground">Shared a new writing draft.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-80 border-red-500 bg-red-500 text-orbit-paper-strong shadow-none lg:col-span-7">
            <CardHeader>
              <CardDescription className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-orbit-paper-strong/75">
                {t("weeklyNote")}
              </CardDescription>
              <CardAction>
                <HugeiconsIcon icon={BookOpen02Icon} size={24} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-10">
              <blockquote className="max-w-3xl text-pretty text-3xl font-black leading-[0.95] tracking-[-0.06em] sm:text-5xl">
                {t("weeklyQuote")}
              </blockquote>
              <div className="flex items-center justify-between border-t border-orbit-paper-strong/35 pt-4 text-[0.6875rem] font-bold uppercase tracking-[0.12em]">
                <span>{t("week", { week: 28 })}</span>
                <span>{t("classesLeft", { count: 6 })}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-4 flex items-center justify-between rounded-[var(--radius)] border border-ink/20 bg-paper-strong px-5 py-4 text-xs font-bold">
          <span className="flex items-center gap-2">
            <HugeiconsIcon icon={Orbit02Icon} size={17} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
            {t("synced")}
          </span>
          <a className="flex items-center gap-2 hover:underline" href="#dashboard-title">
            {t("backToOverview")}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </main>
  );
}
