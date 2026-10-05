import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getDevelopmentStudentClasses } from "@/lib/classes/development-fixtures";

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
  const profile = await loadStudentProfile(studentId);
  const previewClasses =
    process.env.NODE_ENV === "development"
      ? getDevelopmentStudentClasses(
          profile.student.id,
          profile.student.name,
          profile.currency,
        )
      : [];
  return (
    <StudentProfile
      key={profile.student.updatedAt}
      profile={profile}
      previewClasses={previewClasses}
    />
  );
}
