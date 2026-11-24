"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  PencilEdit01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import {
  deleteStudentClassAction,
  setStudentClassStatusAction,
} from "@/app/students/classes/mutation-actions";
import {
  dashboardClassFormSearch,
  dashboardClassTimelineId,
} from "@/app/students/classes/navigation";
import { getClassTimelineAction } from "@/app/students/classes/query-actions";
import { classTimelineQueryKey } from "@/app/students/queries/class-timeline-query-key";

import { ClassScheduleAction, type ClassScheduleScope } from "./class-schedule-action";
import { ClassTimeline } from "./class-timeline";
import { ClassTimelineMenu, type ClassTimelineMenuItem } from "./class-timeline-menu";
import { Card } from "@/components/ui/card";
import type { StudentClassTimeline } from "@/lib/classes/contracts";

export function ClassList({
  initialData,
  timeZone,
  ...scope
}: {
  initialData: StudentClassTimeline;
  timeZone: string;
} & ClassScheduleScope) {
  const { studentId } = scope;
  const allStudents = studentId === undefined;
  const formSearch = allStudents ? dashboardClassFormSearch : "";
  const t = useTranslations("Classes");
  const queryClient = useQueryClient();
  const queryKey = classTimelineQueryKey(studentId);
  const query = useQuery({
    queryKey,
    initialData,
    staleTime: Infinity,
    queryFn: async () => {
      const result = await getClassTimelineAction({ studentId });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
  const [confirmation, setConfirmation] = useState<{
    studentId: string;
    classId: string;
    action: "delete" | "completed" | "cancelled";
  } | null>(null);
  const mutation = useMutation({
    mutationFn: async ({ action, ...target }: NonNullable<typeof confirmation>) => {
      const result =
        action === "delete"
          ? await deleteStudentClassAction(target)
          : await setStudentClassStatusAction({
              ...target,
              status: action,
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
    <section
      id={allStudents ? dashboardClassTimelineId : undefined}
      className="min-w-0"
      aria-labelledby="classes-title"
    >
      <Card className="shadow-none">
        <ClassTimeline
          key={query.data.revision}
          version={query.data.revision}
          studentId={studentId}
          initialData={query.data}
          timeZone={timeZone}
          isError={query.isError}
          actions={<ClassScheduleAction {...scope} />}
          renderClass={(studentClass, summary) => {
            const target = { studentId: studentClass.studentId, classId: studentClass.id };
            const studentHref = `/students/${target.studentId}`;
            const items: ClassTimelineMenuItem[] = [
              {
                id: "edit",
                label: t("actions.edit"),
                icon: PencilEdit01Icon,
                href: `${studentHref}/classes/${target.classId}/edit${formSearch}`,
              },
            ];

            if (allStudents) {
              items.push({
                id: "viewStudentProfile",
                label: t("actions.viewStudentProfile"),
                icon: UserIcon,
                href: studentHref,
              });
            }
            if (studentClass.status !== "completed") {
              items.push({
                id: "complete",
                label: t("actions.complete"),
                icon: CheckmarkCircle02Icon,
                onSelect: () => mutation.mutate({ ...target, action: "completed" }),
              });
            }
            if (studentClass.status !== "cancelled") {
              items.push({
                id: "cancel",
                label: t("actions.cancel"),
                icon: CancelCircleIcon,
                onSelect: () => setConfirmation({ ...target, action: "cancelled" }),
              });
            }
            items.push({
              id: "delete",
              label: t("actions.delete"),
              icon: Delete02Icon,
              variant: "destructive",
              onSelect: () => setConfirmation({ ...target, action: "delete" }),
            });

            return (
              <ClassTimelineMenu
                summary={summary}
                disabled={mutation.isPending}
                items={items}
              />
            );
          }}
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
