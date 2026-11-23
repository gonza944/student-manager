"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, type ReactNode } from "react";

import { FormCloseContext } from "@/components/route-form-modal";
import { getClassFormReturnHref } from "@/app/students/classes/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ClassPage({
  children,
  studentId,
}: {
  children: ReactNode;
  studentId: string;
}) {
  const t = useTranslations("Classes");
  const fromDashboard = useSearchParams().get("from") === "dashboard";
  const closeGuard = useRef<(() => void) | null>(null);
  const registerCloseGuard = useCallback((guard: (() => void) | null) => {
    closeGuard.current = guard;
  }, []);

  return (
    <main className="min-h-dvh bg-background px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <nav aria-label={t("navigation")} className="mx-auto mb-4 max-w-4xl">
        <Button asChild variant="ghost" className="min-h-12 rounded-full">
          <Link
            href={getClassFormReturnHref(studentId, fromDashboard)}
            onNavigate={(event) => {
              if (closeGuard.current) {
                event.preventDefault();
                closeGuard.current();
              }
            }}
          >
            {t(fromDashboard ? "actions.backToDashboard" : "actions.backToProfile")}
          </Link>
        </Button>
      </nav>
      <Card className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-paper-strong p-0">
        <FormCloseContext.Provider value={registerCloseGuard}>
          {children}
        </FormCloseContext.Provider>
      </Card>
    </main>
  );
}
