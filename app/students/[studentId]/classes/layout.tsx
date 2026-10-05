import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ClassPage } from "./components/class-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Classes");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function StudentClassesLayout({
  children,
  params,
}: LayoutProps<"/students/[studentId]/classes">) {
  const { studentId } = await params;
  return <ClassPage studentId={studentId}>{children as ReactNode}</ClassPage>;
}
