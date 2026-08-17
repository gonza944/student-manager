"use client";

import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
  getDateOnlyToday,
  studentSources,
  type StudentRateHistoryEntry,
} from "@/lib/students/contracts";
import { addDateOnlyDays } from "@/lib/students/rate-history";

import { useUpdateStudentRateMutation } from "../../hooks/use-student-rate-history";
import { toMinorUnits } from "../../utils/to-minor-units";

export function StudentRateEditor({
  currency,
  fractionDigits,
  grossMinor,
  initialSource,
  studentId,
  timeZone,
}: {
  currency: string;
  fractionDigits: number;
  grossMinor: number;
  initialSource: StudentRateHistoryEntry["source"];
  studentId: string;
  timeZone: string;
}) {
  const t = useTranslations("Students");
  const [open, setOpen] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
  const [source, setSource] = useState(initialSource);
  const [hasCustomPeriod, setHasCustomPeriod] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const minorFactor = 10 ** fractionDigits;
  const today = getDateOnlyToday(timeZone) ?? "";
  const yesterday = today ? addDateOnlyDays(today, -1) : "";
  const mutation = useUpdateStudentRateMutation(studentId, () =>
    setOpen(false),
  );

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
          setHasCustomPeriod(false);
          setStartDate("");
          setEndDate("");
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
            mutation.mutate({
              hourlyRateMinor: toMinorUnits(hourlyRate, fractionDigits),
              source,
              hasCustomPeriod,
              startDate: hasCustomPeriod ? startDate || null : null,
              endDate: hasCustomPeriod ? endDate || null : null,
            });
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

          <div className="grid gap-2">
            <div className="flex items-start gap-3">
              <input
                id="student-rate-custom-period"
                name="hasCustomPeriod"
                type="checkbox"
                checked={hasCustomPeriod}
                className="mt-0.5 size-5 shrink-0 accent-orbit-ink"
                aria-describedby="student-rate-custom-period-hint"
                onChange={(event) => {
                  const checked = event.target.checked;
                  setHasCustomPeriod(checked);
                  setStartDate(checked ? today : "");
                  setEndDate("");
                  mutation.reset();
                }}
              />
              <div className="grid gap-1">
                <Label htmlFor="student-rate-custom-period">
                  {t("profile.rateHistory.customPeriod")}
                </Label>
                <p
                  id="student-rate-custom-period-hint"
                  className="text-xs text-muted-foreground">
                  {t("profile.rateHistory.customPeriodHint")}
                </p>
              </div>
            </div>

            <MotionConfig reducedMotion="user">
              <AnimatePresence initial={false}>
                {hasCustomPeriod ? (
                  <motion.div
                    key="custom-rate-period"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden">
                    <div className="mt-2 grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="student-rate-start-date">
                          {t("profile.rateHistory.startDate")}
                        </Label>
                        <Input
                          id="student-rate-start-date"
                          name="startDate"
                          type="date"
                          value={startDate}
                          max={today}
                          required
                          aria-invalid={
                            mutation.error?.message === "invalidRateDate" ||
                            mutation.error?.message === "rateOverlap"
                          }
                          aria-describedby="student-rate-date-hint student-rate-date-error"
                          className="h-11 rounded-xl"
                          onChange={(event) => {
                            setStartDate(event.target.value);
                            if (endDate && endDate < event.target.value) {
                              setEndDate("");
                            }
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="student-rate-end-date">
                          {t("profile.rateHistory.endDate")}
                        </Label>
                        <Input
                          id="student-rate-end-date"
                          name="endDate"
                          type="date"
                          value={endDate}
                          min={startDate}
                          max={yesterday}
                          aria-invalid={
                            mutation.error?.message === "invalidRateDate"
                          }
                          aria-describedby="student-rate-date-hint student-rate-date-error"
                          className="h-11 rounded-xl"
                          onChange={(event) => setEndDate(event.target.value)}
                        />
                      </div>
                      <p
                        id="student-rate-date-hint"
                        className="text-xs text-muted-foreground sm:col-span-2">
                        {t("profile.rateHistory.endDateHint")}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </MotionConfig>
          </div>

          {mutation.isError ? (
            <p
              id="student-rate-date-error"
              role="alert"
              className="text-sm font-medium text-destructive">
              {t(
                mutation.error.message === "rateOverlap"
                  ? "profile.rateHistory.overlapError"
                  : mutation.error.message === "invalidRateDate" ||
                      mutation.error.message === "validation"
                    ? "profile.rateHistory.dateError"
                    : "profile.rateHistory.error",
              )}
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
