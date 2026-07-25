import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/server";
import { teacherRateSettingsSchema } from "@/lib/students/contracts";
import { AddStudentForm } from "./add-student-form";


export async function AddStudentContent() {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);

  return (
    <AddStudentForm
      currency={settings.currency}
      preplyCommissionBps={settings.preplyCommissionBps}
    />
  );
}
