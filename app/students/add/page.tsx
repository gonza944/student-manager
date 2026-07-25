import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AddStudentContent } from "./components/add-student-content";
import { Card } from "@/components/ui/card";


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Students");
  return { title: t("form.title") };
}

export default function AddStudentPage() {
  return (
    <div className="min-h-dvh bg-background sm:px-6 lg:px-10 lg:py-8">
      <Card className="mx-auto w-full rounded-none sm:rounded-3xl border border-border bg-paper-strong shadow-sm">
        <AddStudentContent />
      </Card>
    </div>
  );
}
