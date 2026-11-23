import "server-only";

import { and, asc, eq, gte, lt, ne, sql } from "drizzle-orm";

import type { createDb } from "../../db";
import { studentClass } from "../../db/class-schema";
import { student } from "../../db/student-schema";
import { getClassDayRange } from "../classes/scheduling";
import { getDateOnlyToday } from "../students/contracts";
import { getZonedDateStart } from "../students/rate-history";

function offsetMonthStart(isoMonthStart: string, months: number) {
  const date = new Date(`${isoMonthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export async function getTeacherDashboardMetrics(
  db: ReturnType<typeof createDb>,
  teacherId: string,
  timeZone: string,
  now = new Date(),
) {
  const today = getDateOnlyToday(timeZone, now);
  if (!today) throw new Error("Unable to resolve the teacher's local date.");

  const monthStartDate = `${today.slice(0, 7)}-01`;
  const nextMonthStartDate = offsetMonthStart(monthStartDate, 1);
  const previousMonthStart = getZonedDateStart(
    offsetMonthStart(monthStartDate, -1),
    timeZone,
  );
  const monthStart = getZonedDateStart(monthStartDate, timeZone);
  const nextMonthStart = getZonedDateStart(nextMonthStartDate, timeZone);
  const { dayStart, dayEnd } = getClassDayRange(today, timeZone);
  const classTeacher = eq(studentClass.teacherId, teacherId);

  const [[studentCounts], [classCounts], revenue] = await db.batch([
    db
      .select({
        activeStudents: sql`count(case when ${student.isActive} = 1 then 1 end)`
          .mapWith(Number)
          .as("active_students"),
        newStudentsThisMonth: sql`count(case when ${student.studentSince} >= ${monthStartDate}
          and ${student.studentSince} < ${nextMonthStartDate} then 1 end)`
          .mapWith(Number)
          .as("new_students_this_month"),
      })
      .from(student)
      .where(eq(student.teacherId, teacherId)),
    db
      .select({
        classesThisMonth: sql`count(*)`.mapWith(Number).as("classes_this_month"),
        classesToday: sql`count(case when ${studentClass.scheduledAt} >= ${dayStart.getTime()}
          and ${studentClass.scheduledAt} < ${dayEnd.getTime()} then 1 end)`
          .mapWith(Number)
          .as("classes_today"),
      })
      .from(studentClass)
      .where(and(
        classTeacher,
        gte(studentClass.scheduledAt, monthStart),
        lt(studentClass.scheduledAt, nextMonthStart),
        ne(studentClass.status, "cancelled"),
      )),
    db
      .select({
        currency: studentClass.currency,
        currentMinor: sql`sum(case when ${studentClass.scheduledAt} >= ${monthStart.getTime()}
          then ${studentClass.chargeMinor} else 0 end)`.mapWith(Number).as("current_minor"),
        previousMinor: sql`sum(case when ${studentClass.scheduledAt} < ${monthStart.getTime()}
          then ${studentClass.chargeMinor} else 0 end)`.mapWith(Number).as("previous_minor"),
      })
      .from(studentClass)
      .where(and(
        classTeacher,
        gte(studentClass.scheduledAt, previousMonthStart),
        lt(studentClass.scheduledAt, nextMonthStart),
        eq(studentClass.status, "completed"),
      ))
      .groupBy(studentClass.currency)
      .orderBy(asc(studentClass.currency)),
  ]);

  return { ...studentCounts, ...classCounts, previousMonthStart, revenue };
}
