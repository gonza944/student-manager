"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RouteFormModal } from "@/components/route-form-modal";

export function ClassModal({ children, mode }: { children: ReactNode; mode: "add" | "edit" }) {
  const t = useTranslations("Classes");
  const prefix = mode;
  return (
    <RouteFormModal
      title={t(`${prefix}.title`)}
      description={t(`${prefix}.description`)}
      closeLabel={t("modal.close")}
      className="w-[min(96vw,52rem)]">
      {children}
    </RouteFormModal>
  );
}
