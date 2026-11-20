import "server-only";

import { z } from "zod";

import { requireRole } from "@/lib/auth/server";
import { timeZoneSchema } from "@/lib/students/contracts";

export type ClassActionError =
  | {
      ok: false;
      error:
        | "unauthenticated"
        | "forbidden"
        | "notFound"
        | "inactiveStudent"
        | "invalidClassDate"
        | "invalidClassInterval"
        | "scheduleConflict";
    }
  | { ok: false; error: "validation"; fields: string[] };
export type ClassActionResult<T> = { ok: true; data: T } | ClassActionError;

export async function getTeacherContext(): Promise<
  | { ok: true; teacherId: string; timeZone: string }
  | ClassActionError
> {
  const auth = await requireRole("teacher");
  if ("error" in auth) return { ok: false, error: auth.error };

  const timeZone = timeZoneSchema.safeParse(auth.session.user.timeZone);
  if (!timeZone.success) {
    throw new Error("The authenticated teacher has an invalid time zone.");
  }

  return {
    ok: true,
    teacherId: auth.session.user.id,
    timeZone: timeZone.data,
  };
}

export function validationError(error: z.ZodError): ClassActionError {
  return {
    ok: false,
    error: "validation",
    fields: [
      ...new Set(error.issues.map((issue) => String(issue.path[0] ?? "form"))),
    ],
  };
}
