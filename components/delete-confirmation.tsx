"use client";


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

export function DeleteConfirmation({
  title,
  description,
  cancelLabel,
  confirmLabel,
  closeLabel,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const isDesktop = useIsDesktop();
  const actions = (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {isDesktop ? (
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {cancelLabel}
          </Button>
        </DialogClose>
      ) : (
        <DrawerClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {cancelLabel}
          </Button>
        </DrawerClose>
      )}
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent closeLabel={closeLabel} showCloseButton={false} className="p-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-4">
            {description}
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
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="my-4">
            {description}
          </DrawerDescription>
          {actions}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
