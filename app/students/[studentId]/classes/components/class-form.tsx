"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StudentDatePicker } from "@/app/students/add/components/student-date-picker";
import {
  createStudentClassAction,
  updateStudentClassAction,
} from "@/app/students/classes/mutation-actions";
import { getClassAvailabilityAction } from "@/app/students/classes/query-actions";
import { toMinorUnits } from "@/app/students/utils/to-minor-units";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { useFormCloseGuard } from "@/components/route-form-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateClassChargeMinor } from "@/lib/classes/charge";
import {
  classAvailabilityInputSchema,
  createStudentClassInputSchema,
  updateStudentClassInputSchema,
  type StudentClassDto,
} from "@/lib/classes/contracts";
import {
  getClassPreferredTime,
  getClassTimeOptions,
} from "@/lib/classes/time-options";

import { ClassFormSections } from "./class-form-sections";
import { ClassDayGrid } from "./class-day-grid";

export function ClassForm({
  studentId,
  studentClass,
  timeZone,
  studentSince,
  studentIsActive,
  hourlyRateMinor,
  currency,
  initialDate,
}: {
  studentId: string;
  studentClass?: StudentClassDto;
  timeZone: string;
  studentSince: string;
  studentIsActive: boolean;
  hourlyRateMinor: number;
  currency: string;
  initialDate: string;
}) {
  const t = useTranslations("Classes");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: studentClass?.currency ?? currency,
    currencyDisplay: "code",
  });
  const fractionDigits = money.resolvedOptions().maximumFractionDigits ?? 2;
  const factor = 10 ** fractionDigits;
  const [date, setDate] = useState(initialDate);
  const [scheduledAt, setScheduledAt] = useState(
    studentClass?.scheduledAt ?? "",
  );
  const [duration, setDuration] = useState(
    String(studentClass?.durationMinutes ?? 60),
  );
  const initialCharge = String(
    (studentClass?.chargeMinor ??
      calculateClassChargeMinor(hourlyRateMinor, 60)) / factor,
  );
  const [charge, setCharge] = useState(initialCharge);
  const [clientError, setClientError] = useState<
    "" | "validation" | "scheduleConflict"
  >("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openedAt] = useState(() => new Date());
  const registerCloseGuard = useFormCloseGuard();
  const dirty =
    !saved &&
    (date !== initialDate ||
      scheduledAt !== (studentClass?.scheduledAt ?? "") ||
      duration !== String(studentClass?.durationMinutes ?? 60) ||
      charge !== initialCharge);
  const durationMinutes = Number(duration);
  const validDuration =
    Number.isSafeInteger(durationMinutes) &&
    durationMinutes > 0 &&
    durationMinutes % 5 === 0 &&
    durationMinutes <= 1500;
  const validDate =
    classAvailabilityInputSchema.safeParse({ localDate: date }).success &&
    date >= studentSince;
  const inactive = !studentClass && !studentIsActive;
  const availability = useQuery({
    queryKey: ["class-availability", date, studentClass?.id ?? null],
    enabled: validDate && !inactive,
    queryFn: async () => {
      const result = await getClassAvailabilityAction({
        localDate: date,
        excludeClassId: studentClass?.id ?? null,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 0,
  });
  const options =
    availability.data && validDuration
      ? getClassTimeOptions(
          studentClass?.status === "cancelled"
            ? { ...availability.data, intervals: [] }
            : availability.data,
          durationMinutes,
          timeZone,
          locale,
        )
      : [];
  const preferredTime = availability.data
    ? getClassPreferredTime(availability.data, timeZone, openedAt)
    : openedAt.getTime();
  const selected = options.find((option) => option.value === scheduledAt);
  const intervalValid = selected && !selected.disabled;
  const calculatedCharge = validDuration
    ? calculateClassChargeMinor(
        studentClass?.hourlyRateSnapshotMinor ?? hourlyRateMinor,
        durationMinutes,
      )
    : 0;
  const durationChanged =
    studentClass && durationMinutes !== studentClass.durationMinutes;
  const chargeMinor = durationChanged
    ? calculatedCharge
    : toMinorUnits(charge, fractionDigits);
  const validCharge =
    durationChanged ||
    (charge.trim() !== "" &&
      Number.isFinite(Number(charge)) &&
      Number(charge) >= 0 &&
      chargeMinor <= 100_000_000);
  function changeDuration(value: string) {
    setDuration(value);
    const nextDuration = Number(value);
    if (
      !studentClass &&
      Number.isSafeInteger(nextDuration) &&
      nextDuration > 0 &&
      nextDuration % 5 === 0 &&
      nextDuration !== durationMinutes
    ) {
      setCharge(
        String(
          calculateClassChargeMinor(hourlyRateMinor, nextDuration) / factor,
        ),
      );
    }
  }
  const save = useMutation({
    mutationFn: async () => {
      const result = studentClass
        ? await updateStudentClassAction({
            studentId,
            classId: studentClass.id,
            scheduledAt,
            durationMinutes,
            chargeMinor,
          })
        : await createStudentClassAction({
            studentId,
            scheduledAt,
            durationMinutes,
            chargeMinor,
          });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onError: (error) => {
      if (error.message === "scheduleConflict") void availability.refetch();
    },
    onSuccess: async () => {
      setSaved(true);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["student-classes", studentId],
        }),
        queryClient.invalidateQueries({ queryKey: ["class-availability"] }),
      ]);
      toast.success(t(studentClass ? "success.updated" : "success.created"));
      router.push(`/students/${studentId}`);
      router.refresh();
    },
  });
  const error =
    clientError ||
    (save.error?.message === "scheduleConflict"
      ? "scheduleConflict"
      : save.error
        ? "general"
        : availability.isError
          ? "availability"
          : "");
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    registerCloseGuard?.(
      save.isPending ? () => {} : dirty ? () => setDiscardOpen(true) : null,
    );
    return () => registerCloseGuard?.(null);
  }, [dirty, registerCloseGuard, save.isPending]);

  return (
    <form
      className="mt-4 flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        setClientError("");
        const input = {
          studentId,
          scheduledAt,
          durationMinutes,
          chargeMinor,
          classId: studentClass?.id,
        };
        const parsed = studentClass
          ? updateStudentClassInputSchema.safeParse(input)
          : createStudentClassInputSchema.safeParse(input);
        if (!validDate || !validDuration || !validCharge || !parsed.success) {
          setClientError("validation");
          return;
        }
        if (!intervalValid) {
          setClientError("scheduleConflict");
          return;
        }
        save.mutate();
      }}
    >
      <fieldset
        disabled={save.isPending || inactive}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <ClassFormSections
          schedule={
            <>
              <div className="grid shrink-0 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="class-date">{t("fields.date")}</Label>
                  <StudentDatePicker
                    id="class-date"
                    name="date"
                    value={date}
                    locale={locale}
                    timeZone={timeZone}
                    placeholder={t("fields.datePlaceholder")}
                    openLabel={t("fields.openDate")}
                    minDate={studentSince}
                    limitToToday={false}
                    required
                    invalid={!validDate}
                    onValueChange={(value) => {
                      setDate(value);
                      setScheduledAt("");
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-charge">
                    {t("fields.chargeCurrency", {
                      currency: studentClass?.currency ?? currency,
                    })}
                  </Label>
                  <Input
                    id="class-charge"
                    name="charge"
                    type="number"
                    min={0}
                    step={1 / factor}
                    required
                    aria-invalid={!validCharge}
                    value={
                      durationChanged
                        ? validDuration
                          ? String(calculatedCharge / factor)
                          : ""
                        : charge
                    }
                    readOnly={Boolean(durationChanged)}
                    onChange={(event) => setCharge(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              {availability.isFetching ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : null}
              {validDuration &&
              availability.data &&
              !availability.isFetching &&
              options.every((option) => option.disabled) ? (
                <p className="text-sm text-muted-foreground">{t("noTimes")}</p>
              ) : null}
              {availability.data && validDate ? (
                <ClassDayGrid
                  key={date}
                  allowOverlap={studentClass?.status === "cancelled"}
                  day={availability.data}
                  scheduledAt={scheduledAt}
                  durationMinutes={durationMinutes}
                  timeZone={timeZone}
                  preferredTime={preferredTime}
                  disabled={
                    save.isPending ||
                    inactive ||
                    availability.isFetching ||
                    !validDuration
                  }
                  onSelect={(start, nextDuration) => {
                    setScheduledAt(start);
                    changeDuration(String(nextDuration));
                  }}
                />
              ) : null}
            </>
          }
          occupied={
            availability.data?.intervals.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {availability.data.intervals.map((interval) => (
                  <li key={interval.id}>
                    {new Intl.DateTimeFormat(locale, {
                      timeStyle: "short",
                      timeZone,
                    }).format(new Date(interval.scheduledAt))}{" "}
                    —{" "}
                    {new Intl.DateTimeFormat(locale, {
                      timeStyle: "short",
                      timeZone,
                    }).format(
                      Date.parse(interval.scheduledAt) +
                        interval.durationMinutes * 60_000,
                    )}{" "}
                    · {interval.studentName} ·{" "}
                    {t(`statuses.${interval.status}`)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("sections.noOccupied")}
              </p>
            )
          }
        />
        {inactive ? <p role="alert">{t("errors.inactiveStudent")}</p> : null}
        {error ? (
          <p
            id="class-form-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {t(`errors.${error}`)}
          </p>
        ) : null}
        <div className="mt-auto flex shrink-0 gap-2 pt-2">
          <Button
            type="submit"
            disabled={
              !intervalValid ||
              !validDate ||
              !validDuration ||
              !validCharge ||
              availability.isFetching
            }
          >
            {t(save.isPending ? "actions.saving" : "actions.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (dirty) setDiscardOpen(true);
              else router.push(`/students/${studentId}`);
            }}
          >
            {t("actions.discard")}
          </Button>
        </div>
      </fieldset>
      <DeleteConfirmation
        open={discardOpen}
        pending={false}
        title={t("discard.title")}
        description={t("discard.description")}
        cancelLabel={t("discard.keep")}
        confirmLabel={t("discard.confirm")}
        closeLabel={t("modal.close")}
        onOpenChange={setDiscardOpen}
        onConfirm={() => {
          setSaved(true);
          setDiscardOpen(false);
          router.push(`/students/${studentId}`);
        }}
      />
    </form>
  );
}
