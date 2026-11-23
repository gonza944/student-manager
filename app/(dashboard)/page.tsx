import {
  Calendar03Icon,
  Settings02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { dashboardClassTimelineId } from "@/app/students/classes/navigation";
import { ClassList } from "@/app/students/components/class-list";
import { DashboardLogoutButton } from "@/components/dashboard-logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import { studentClassTimelineInputSchema } from "@/lib/classes/contracts";
import { getTeacherClassTimeline } from "@/lib/classes/queries";
import { getTeacherDashboardMetrics } from "@/lib/dashboard/metrics";
import { teacherRateSettingsSchema, timeZoneSchema } from "@/lib/students/contracts";
import { listTeacherActiveStudentOptions } from "@/lib/students/data";
import { DashboardCards } from "./components/dashboard-cards";

export default async function DashboardPage() {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const teacher = auth.session.user;
  const timeZone = timeZoneSchema.parse(teacher.timeZone);
  const { currency } = teacherRateSettingsSchema.parse(teacher);
  const now = new Date();
  const [t, [metrics, timeline, activeStudents]] = await Promise.all([
    getTranslations("Dashboard"),
    getDb().then((db) =>
      Promise.all([
        getTeacherDashboardMetrics(db, teacher.id, timeZone, now),
        getTeacherClassTimeline(db, teacher.id, studentClassTimelineInputSchema.parse({}), now),
        listTeacherActiveStudentOptions(db, teacher.id),
      ]),
    ),
  ]);
  if (!timeline) throw new Error("Unable to load the teacher's class timeline.");

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <header className="space-y-6">
          <nav className="flex flex-wrap items-center gap-2 lg:justify-end" aria-label={t("navigation")}>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/students">
                <HugeiconsIcon data-icon="inline-start" icon={UserMultipleIcon} aria-hidden="true" />
                {t("students")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/settings">
                <HugeiconsIcon data-icon="inline-start" icon={Settings02Icon} aria-hidden="true" />
                {t("settings")}
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <a href={`#${dashboardClassTimelineId}`}>
                <HugeiconsIcon data-icon="inline-start" icon={Calendar03Icon} aria-hidden="true" />
                {t("viewSchedule")}
              </a>
            </Button>
            <ThemeToggle label={t("toggleTheme")} />
            <DashboardLogoutButton
              copy={{
                label: t("logout"),
                pending: t("loggingOut"),
                failed: t("logoutFailed"),
              }}
            />
          </nav>
          <h1 className="max-w-5xl text-balance text-[clamp(2rem,5vw,4.5rem)] font-black leading-none tracking-tight">
            {t("title")}
          </h1>
        </header>

        <DashboardCards metrics={metrics} currency={currency} timeZone={timeZone} />
        <ClassList activeStudents={activeStudents} initialData={timeline} timeZone={timeZone} />
      </div>
    </main>
  );
}
