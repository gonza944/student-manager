"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RouteFormModal } from "@/components/route-form-modal";

export function StudentFormModal({ children, mode }: { children: ReactNode; mode: "add" | "edit" }) {
  const t = useTranslations("Students");
  const prefix = mode === "add" ? "form" : "edit";
  return (
    <RouteFormModal
      title={t(`${prefix}.title`)}
      description={t(`${prefix}.description`)}
      closeLabel={t(`${prefix}.close`)}
      >
      {children}
    </RouteFormModal>
  );
}
