"use client";

import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/animate-ui/components/radix/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  studentSources,
  type StudentRateTimeline,
} from "@/lib/students/contracts";

import { updateStudentRateAction } from "../../actions";
import { toMinorUnits } from "../../utils/to-minor-units";

export function StudentRateEditor({
  currency,
  fractionDigits,
  grossMinor,
  initialSource,
  studentId,
}: {
  currency: string;
  fractionDigits: number;
  grossMinor: number;
  initialSource: StudentRateTimeline["current"]["source"];
  studentId: string;
}) {
  const t = useTranslations("Students");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
  const [source, setSource] = useState(initialSource);
  const minorFactor = 10 ** fractionDigits;
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await updateStudentRateAction({
        studentId,
        hourlyRateMinor: toMinorUnits(hourlyRate, fractionDigits),
        source,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onError: () => toast.error(t("profile.rateHistory.error")),
    onSuccess: () => {
      setOpen(false);
      toast.success(t("profile.rateHistory.success"));
      router.refresh();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) mutation.reset();
      }}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("profile.rateHistory.edit")}
        className="ms-auto size-11 rounded-full border border-current/25"
        onClick={() => {
          setHourlyRate(String(grossMinor / 10 ** fractionDigits));
          setSource(initialSource);
          mutation.reset();
          setOpen(true);
        }}>
        <HugeiconsIcon
          icon={PencilEdit01Icon}
          size={22}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Button>

      <DialogContent
        closeLabel={t("profile.rateHistory.close")}
        className="gap-5 p-6 sm:max-w-md">
        <div className="space-y-2 pe-10">
          <DialogTitle className="text-xl font-black">
            {t("profile.rateHistory.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("profile.rateHistory.dialogDescription")}
          </DialogDescription>
        </div>

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}>
          <div className="grid gap-2">
            <Label htmlFor="student-quick-rate">
              {t("profile.rateHistory.rate", { currency })}
            </Label>
            <Input
              id="student-quick-rate"
              name="hourlyRate"
              type="number"
              min={1 / minorFactor}
              max={100_000_000 / minorFactor}
              step={1 / minorFactor}
              inputMode="decimal"
              value={hourlyRate}
              required
              className="h-11 rounded-xl"
              onChange={(event) => setHourlyRate(event.target.value)}
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              {t("profile.rateHistory.source")}
            </legend>
            <ToggleGroup
              type="single"
              value={source}
              aria-label={t("profile.rateHistory.source")}
              className="grid w-full grid-cols-2"
              onValueChange={(nextSource) => {
                if (nextSource) {
                  setSource(nextSource as typeof source);
                }
              }}>
              {studentSources.map((studentSource) => (
                <ToggleGroupItem
                  key={studentSource}
                  value={studentSource}
                  className="min-h-11 w-full">
                  {t(`sources.${studentSource}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("profile.rateHistory.feeHint")}
            </p>
          </fieldset>

          {mutation.isError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {t("profile.rateHistory.error")}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl">
                {t("profile.rateHistory.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-h-11 rounded-xl">
              {mutation.isPending
                ? t("profile.rateHistory.saving")
                : t("profile.rateHistory.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
