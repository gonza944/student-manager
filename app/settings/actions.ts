"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import { updateCommissionSettingsInputSchema } from "@/lib/students/contracts";
import { updateTeacherCommissions } from "@/lib/students/data";

export async function updateCommissionSettingsAction(input: unknown) {
  const parsed = updateCommissionSettingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };

  const auth = await requireRole("teacher");
  if ("error" in auth) return { ok: false as const, error: auth.error };

  const data = await updateTeacherCommissions(
    await getDb(),
    auth.session.user.id,
    parsed.data.preplyCommissionBps,
    parsed.data.directCommissionBps,
  );
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/students");
  revalidatePath("/students/[studentId]", "page");

  return { ok: true as const, data };
}
