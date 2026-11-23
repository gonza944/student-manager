import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getStudentClassTimelineAction } from "@/app/students/classes/query-actions";
import { notFound } from "next/navigation";

import { StudentProfile } from "./components/student-profile";
import { loadStudentProfile } from "./load-profile";

export async function generateMetadata({
  params,
}: PageProps<"/students/[studentId]">): Promise<Metadata> {
  const { studentId } = await params;
  const [profile, t] = await Promise.all([
    loadStudentProfile(studentId),
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
  const [profile, result] = await Promise.all([
    loadStudentProfile(studentId),
    getStudentClassTimelineAction({ studentId }),
  ]);
  if (!result.ok) {
    if (result.error === "notFound") notFound();
    throw new Error(result.error);
  }
  return (
    <StudentProfile
      key={profile.student.updatedAt}
      profile={profile}
      classTimeline={result.data}
    />
  );
}
