"use client";

import { useTranslations } from "next-intl";
import { DeleteConfirmation } from "@/components/delete-confirmation";

export function DeleteClassConfirmation(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Classes.delete");
  return (
    <DeleteConfirmation {...props} pending={false}
      title={t("title")}
      description={t("description")}
      cancelLabel={t("cancel")}
      confirmLabel={t("confirm")}
      closeLabel={t("close")} />
  );
}
