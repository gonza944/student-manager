"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PortalContainerProvider } from "@/components/ui/portal-container";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export function AddStudentModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations("Students");
  const isDesktop = useIsDesktop();
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const close = (open: boolean) => {
    if (!open) router.back();
  };

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={close}>
        <DialogContent
          ref={setPortalContainer}
          closeLabel={t("form.close")}
          className="block max-h-[calc(100dvh-2rem)] w-[min(96vw,96rem)] max-w-none overflow-y-auto rounded-3xl bg-paper-strong p-0 text-ink shadow-2xl sm:max-w-none">
          <DialogTitle className="sr-only">{t("form.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("form.description")}
          </DialogDescription>
          <PortalContainerProvider container={portalContainer}>
            {children}
          </PortalContainerProvider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open onOpenChange={close}>
      <DrawerContent ref={setPortalContainer}>
        <DrawerTitle className="sr-only">{t("form.title")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("form.description")}
        </DrawerDescription>
        <PortalContainerProvider container={portalContainer}>
          <div className="relative overflow-y-auto overscroll-contain">
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("form.close")}
                className="absolute end-4 top-3 z-10">
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Button>
            </DrawerClose>
            {children}
          </div>
        </PortalContainerProvider>
      </DrawerContent>
    </Drawer>
  );
}
