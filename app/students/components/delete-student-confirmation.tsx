"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { useIsDesktop } from "@/hooks/use-is-desktop";

export function DeleteStudentConfirmation({
  name,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Students.deleteDialog");
  const isDesktop = useIsDesktop();
  const actions = (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {isDesktop ? (
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {t("cancel")}
          </Button>
        </DialogClose>
      ) : (
        <DrawerClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {t("cancel")}
          </Button>
        </DrawerClose>
      )}
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={onConfirm}>
        {pending ? t("deleting") : t("confirm")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent closeLabel={t("close")} showCloseButton={false} className="p-6">
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription className="mt-4">
            {t("description", { name })}
          </DialogDescription>
          {actions}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="p-6">
          <DrawerTitle>{t("title", { name })}</DrawerTitle>
          <DrawerDescription className="my-4">
            {t("description", { name })}
          </DrawerDescription>
          {actions}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
