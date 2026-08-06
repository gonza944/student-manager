import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";

import { StudentFormContent } from "../../add/components/student-form-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Students");
  return { title: t("edit.title") };
}

export default async function EditStudentPage({
  params,
}: PageProps<"/students/edit/[studentId]">) {
  const { studentId } = await params;

  return (
    <Card className="mx-auto w-full rounded-none border border-border bg-paper-strong shadow-sm sm:rounded-3xl">
      <StudentFormContent studentId={studentId} />
    </Card>
  );
}
