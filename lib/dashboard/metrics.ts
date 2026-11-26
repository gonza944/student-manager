import "server-only";

import { and, asc, count, desc, eq, gte, lt, lte, ne, sql, type SQL, type SQLWrapper } from "drizzle-orm";

import type { createDb } from "../../db";
import { studentClass } from "../../db/class-schema";
import { student, studentRateHistory } from "../../db/student-schema";
import { getClassDayRange } from "../classes/scheduling";
import { getDateOnlyToday } from "../students/contracts";
import { getZonedDateStart } from "../students/rate-history";

function offsetMonthStart(isoMonthStart: string, months: number) {
  const date = new Date(`${isoMonthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function sumWhen(condition: SQL, amount: SQLWrapper) {
  return sql`sum(case when ${condition} then ${amount} else 0 end)`.mapWith(Number);
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
  const inCurrentMonth = gte(studentClass.scheduledAt, monthStart);
  const classRateId = db
    .select({ id: studentRateHistory.id })
    .from(studentRateHistory)
    .where(and(
      eq(studentRateHistory.teacherId, studentClass.teacherId),
      eq(studentRateHistory.studentId, studentClass.studentId),
      lte(studentRateHistory.effectiveAt, studentClass.scheduledAt),
    ))
    .orderBy(desc(studentRateHistory.effectiveAt), desc(sql`${studentRateHistory}.rowid`))
    .limit(1);
  const classFeeMinor = sql`cast((${studentClass.chargeMinor} * coalesce(${studentRateHistory.feeBps}, 0) + 5000) / 10000 as integer)`;
  const classNetMinor = sql`${studentClass.chargeMinor} - ${classFeeMinor}`;
  const classSource = sql`coalesce(${studentRateHistory.source}, ${student.source})`;
  const preplyThisMonth = sql`${inCurrentMonth} and ${classSource} = 'preply'`;
  const directThisMonth = sql`${inCurrentMonth} and ${classSource} = 'private'`;

  const [[{ newStudentsThisMonth }], [classCounts], revenue] = await db.batch([
    db
      .select({ newStudentsThisMonth: count() })
      .from(student)
      .where(and(
        eq(student.teacherId, teacherId),
        gte(student.studentSince, monthStartDate),
        lt(student.studentSince, nextMonthStartDate),
      )),
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
        inCurrentMonth,
        lt(studentClass.scheduledAt, nextMonthStart),
        ne(studentClass.status, "cancelled"),
      )),
    db
      .select({
        currency: studentClass.currency,
        currentGrossMinor: sumWhen(inCurrentMonth, studentClass.chargeMinor).as("current_gross_minor"),
        currentNetMinor: sumWhen(inCurrentMonth, classNetMinor).as("current_net_minor"),
        currentGrossMinorBySource: {
          preply: sumWhen(preplyThisMonth, studentClass.chargeMinor).as("current_preply_gross_minor"),
          private: sumWhen(directThisMonth, studentClass.chargeMinor).as("current_direct_gross_minor"),
        },
        currentNetMinorBySource: {
          preply: sumWhen(preplyThisMonth, classNetMinor).as("current_preply_net_minor"),
          private: sumWhen(directThisMonth, classNetMinor).as("current_direct_net_minor"),
        },
        previousGrossMinor: sumWhen(lt(studentClass.scheduledAt, monthStart), studentClass.chargeMinor)
          .as("previous_gross_minor"),
      })
      .from(studentClass)
      .innerJoin(student, and(
        eq(student.id, studentClass.studentId),
        eq(student.teacherId, studentClass.teacherId),
      ))
      .leftJoin(studentRateHistory, and(
        inCurrentMonth,
        eq(studentRateHistory.id, sql`(${classRateId})`),
      ))
      .where(and(
        classTeacher,
        gte(studentClass.scheduledAt, previousMonthStart),
        lt(studentClass.scheduledAt, nextMonthStart),
        eq(studentClass.status, "completed"),
      ))
      .groupBy(studentClass.currency)
      .orderBy(asc(studentClass.currency)),
  ]);

  return { newStudentsThisMonth, ...classCounts, previousMonthStart, revenue };
}
