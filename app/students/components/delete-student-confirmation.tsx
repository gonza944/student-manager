"use client";

import { useTranslations } from "next-intl";
import { DeleteConfirmation } from "@/components/delete-confirmation";

export function DeleteStudentConfirmation({ name, pending, ...props }: {
  name: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Students.deleteDialog");
  return (
    <DeleteConfirmation {...props} pending={pending}
      title={t("title", { name })}
      description={t("description", { name })}
      cancelLabel={t("cancel")}
      confirmLabel={pending ? t("deleting") : t("confirm")}
      closeLabel={t("close")} />
  );
}
