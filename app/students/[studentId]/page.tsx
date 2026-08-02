import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import {
  studentIdInputSchema,
  teacherRateSettingsSchema,
} from "@/lib/students/contracts";
import { getTeacherStudentProfile } from "@/lib/students/data";

import { StudentProfile } from "./components/student-profile";

const loadProfile = cache(async (studentId: string) => {
  const parsed = studentIdInputSchema.safeParse({ studentId });
  if (!parsed.success) notFound();

  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);
  const profile = await getTeacherStudentProfile(
    await getDb(),
    auth.session.user.id,
    settings,
    parsed.data.studentId,
  );
  if (!profile) notFound();

  return profile;
});

export async function generateMetadata({
  params,
}: PageProps<"/students/[studentId]">): Promise<Metadata> {
  const { studentId } = await params;
  const [profile, t] = await Promise.all([
    loadProfile(studentId),
    getTranslations("Students.profile"),
  ]);

  return {
    title: t("metaTitle", { name: profile.student.name }),
    description: t("metaDescription", { name: profile.student.name }),
  };
}

export default async function StudentProfilePage({
  params,
}: PageProps<"/students/[studentId]">) {
  const { studentId } = await params;
  return <StudentProfile profile={await loadProfile(studentId)} />;
}
