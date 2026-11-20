import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import {
  studentIdInputSchema,
  teacherRateSettingsSchema,
  timeZoneSchema,
} from "@/lib/students/contracts";
import { getTeacherStudentProfile } from "@/lib/students/data";

export const loadStudentProfile = cache(async (studentId: string) => {
  const parsed = studentIdInputSchema.safeParse({ studentId });
  if (!parsed.success) notFound();

  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);
  const timeZone = timeZoneSchema.parse(auth.session.user.timeZone);
  const profile = await getTeacherStudentProfile(
    await getDb(),
    auth.session.user.id,
    { ...settings, timeZone },
    parsed.data.studentId,
  );
  if (!profile) notFound();

  return profile;
});
