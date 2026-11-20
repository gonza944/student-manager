"use client";

import {
  Add01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import {
  deleteStudentClassAction,
  setStudentClassStatusAction,
} from "@/app/students/classes/mutation-actions";
import { getStudentClassTimelineAction } from "@/app/students/classes/query-actions";

import { ClassTimeline } from "./class-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentClassTimeline } from "@/lib/classes/contracts";

export function ClassList({
  initialData,
  studentId,
  studentIsActive,
  timeZone,
}: {
  initialData: StudentClassTimeline;
  studentId: string;
  studentIsActive: boolean;
  timeZone: string;
}) {
  const t = useTranslations("Classes");
  const queryClient = useQueryClient();
  const queryKey = ["student-classes", studentId];
  const query = useQuery({
    queryKey,
    initialData,
    staleTime: Infinity,
    queryFn: async () => {
      const result = await getStudentClassTimelineAction({ studentId });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
  const [confirmation, setConfirmation] = useState<{
    classId: string;
    action: "delete" | "completed" | "cancelled";
  } | null>(null);
  const mutation = useMutation({
    mutationFn: async (input: NonNullable<typeof confirmation>) => {
      const result =
        input.action === "delete"
          ? await deleteStudentClassAction({
              studentId,
              classId: input.classId,
            })
          : await setStudentClassStatusAction({
              studentId,
              classId: input.classId,
              status: input.action,
            });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setConfirmation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["class-availability"] }),
      ]);
      toast.success(t("success.changed"));
    },
    onError: (error) =>
      toast.error(
        t(
          error.message === "scheduleConflict"
            ? "errors.scheduleConflict"
            : "errors.general",
        ),
      ),
  });

  return (
    <section className="min-w-0" aria-labelledby="classes-title">
      <Card className="border-orbit-ink/20 bg-paper-strong text-orbit-ink shadow-none">
        <ClassTimeline
          key={query.dataUpdatedAt}
          version={query.dataUpdatedAt}
          studentId={studentId}
          initialData={query.data}
          timeZone={timeZone}
          isError={query.isError}
          actions={
            <>
              {studentIsActive ? (
                <Button
                  asChild
                  variant="outline"
                  className="min-h-12 rounded-full bg-transparent text-orbit-ink"
                >
                  <Link href={`/students/${studentId}/classes/add`}>
                    <HugeiconsIcon
                      icon={Add01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {t("actions.add")}
                  </Link>
                </Button>
              ) : (
                <Button
                  disabled
                  variant="outline"
                  className="min-h-12 rounded-full bg-transparent text-orbit-ink"
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {t("actions.add")}
                </Button>
              )}
            </>
          }
          renderClass={(studentClass, summary) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  className="relative flex w-full flex-col items-center rounded-xl p-3 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {summary}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 p-2">
                <DropdownMenuItem asChild className="py-2">
                  <Link
                    href={`/students/${studentId}/classes/${studentClass.id}/edit`}
                  >
                    <HugeiconsIcon
                      icon={PencilEdit01Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {t("actions.edit")}
                  </Link>
                </DropdownMenuItem>
                {studentClass.status !== "completed" ? (
                  <DropdownMenuItem
                    className="py-2"
                    onSelect={() =>
                      mutation.mutate({
                        classId: studentClass.id,
                        action: "completed",
                      })
                    }
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {t("actions.complete")}
                  </DropdownMenuItem>
                ) : null}
                {studentClass.status !== "cancelled" ? (
                  <DropdownMenuItem
                    className="py-2"
                    onSelect={() =>
                      setConfirmation({
                        classId: studentClass.id,
                        action: "cancelled",
                      })
                    }
                  >
                    <HugeiconsIcon
                      icon={CancelCircleIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {t("actions.cancel")}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  variant="destructive"
                  className="py-2"
                  onSelect={() =>
                    setConfirmation({
                      classId: studentClass.id,
                      action: "delete",
                    })
                  }
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </Card>
      <DeleteConfirmation
        open={confirmation !== null}
        pending={mutation.isPending}
        title={t(
          confirmation?.action === "delete"
            ? "delete.title"
            : "lifecycle.title",
        )}
        description={t(
          confirmation?.action === "delete"
            ? "delete.description"
            : "lifecycle.cancelDescription",
        )}
        cancelLabel={t("delete.cancel")}
        closeLabel={t("delete.close")}
        confirmLabel={t(
          mutation.isPending
            ? "actions.saving"
            : confirmation?.action === "delete"
              ? "delete.confirm"
              : "actions.cancel",
        )}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation);
        }}
      />
    </section>
  );
}
