"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  calculateStudentRate,
  createStudentInputSchema,
  type CreateStudentInput,
  type StudentDto,
} from "@/lib/students/contracts";

import { createStudentAction, updateStudentAction } from "../../actions";
import { StudentCard } from "../../components/student-card";
import { toMinorUnits } from "../../utils/to-minor-units";
import { StudentLearningFields } from "./student-learning-fields";
import {
  getInitialForm,
  initialStudentForm,
  type StudentFormValues,
  type UpdateStudentForm,
} from "../utils/student-form-model";
import { StudentPersonalFields } from "./student-personal-fields";
import { StudentSettingsFields } from "./student-settings-fields";

type StudentFormError = Error & { fields?: string[] };

export function StudentForm({
  currency,
  preplyCommissionBps,
  directCommissionBps,
  student,
}: {
  currency: string;
  preplyCommissionBps: number;
  directCommissionBps: number;
  student?: StudentDto;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale],
  );
  const currencyFractionDigits =
    currencyFormatter.resolvedOptions().maximumFractionDigits ?? 2;
  const minorFactor = 10 ** currencyFractionDigits;
  const [form, setForm] = useState<StudentFormValues>(() =>
    getInitialForm(student, minorFactor),
  );
  const [clientInvalidFields, setClientInvalidFields] = useState<string[]>([]);
  const updateField: UpdateStudentForm = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const hourlyRateMinor = toMinorUnits(form.hourlyRate, currencyFractionDigits);
  const rates = calculateStudentRate(
    hourlyRateMinor,
    form.source,
    preplyCommissionBps,
    directCommissionBps,
  );
  const formatMoney = (minor: number) =>
    currencyFormatter.format(minor / minorFactor);
  const saveMutation = useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const result = student
        ? await updateStudentAction({ ...input, studentId: student.id })
        : await createStudentAction(input);
      if (!result.ok) {
        const error = new Error(result.error) as StudentFormError;
        error.fields =
          result.error === "validation"
            ? result.fields
            : result.error === "conflict"
              ? ["email"]
              : undefined;
        throw error;
      }
      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        student &&
          queryClient.refetchQueries({
            queryKey: ["student-rate-history", student.id],
            exact: true,
            type: "all",
          }),
      ]);
      setForm(initialStudentForm);
      setClientInvalidFields([]);
      if (student) toast.success(t("edit.success"));
      router.push(student ? `/students/${student.id}` : "/students");
    },
  });
  const mutationFields = (saveMutation.error as StudentFormError | null)?.fields;
  const invalidFields = new Set([
    ...clientInvalidFields,
    ...(mutationFields ?? []),
  ]);
  const isEditing = student !== undefined;

  return (
    <div className="p-4 sm:p-6 xl:p-7">
      <div className="mb-5 pe-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {t(isEditing ? "edit.eyebrow" : "form.eyebrow")}
        </p>
        <h1
          id={isEditing ? "edit-student-title" : "add-student-title"}
          className="text-3xl font-black tracking-[-0.05em]">
          {t(isEditing ? "edit.title" : "form.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t(isEditing ? "edit.description" : "form.description")}
        </p>
      </div>

      <form
        className="grid gap-6 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(16rem,0.7fr)_repeat(2,minmax(0,1fr))]"
        onSubmit={(event) => {
          event.preventDefault();
          setClientInvalidFields([]);

          const input = createStudentInputSchema.safeParse({
            ...form,
            hourlyRateMinor,
          });

          if (!input.success) {
            setClientInvalidFields([
              ...new Set(
                input.error.issues.map((issue) =>
                  String(issue.path[0] ?? "form"),
                ),
              ),
            ]);
            return;
          }

          saveMutation.mutate(input.data);
        }}>
        <aside className="flex h-fit flex-col gap-4 p-4 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <StudentCard
            student={{
              name: form.name || t("form.previewName"),
              source: form.source,
              level: form.level,
              isActive: form.isActive,
              avatarKey: form.avatarKey,
              themeColor: form.themeColor,
              rates,
            }}
            formatMoney={formatMoney}
            preview
          />
          <dl className="grid grid-cols-2 gap-x-2 text-center text-sm font-semibold text-muted-foreground">
            <div>
              <dt className="inline">{t("form.rateBreakdown.gross")}:</dt>{" "}
              <dd className="inline">{formatMoney(rates.grossMinor)}</dd>
            </div>
            <div>
              <dt className="inline">{t("form.rateBreakdown.fee")}:</dt>{" "}
              <dd className="inline">
                {formatMoney(rates.platformFeeMinor)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="inline">{t("form.rateBreakdown.net")}:</dt>{" "}
              <dd className="inline">{formatMoney(rates.netMinor)}</dd>
            </div>
          </dl>
        </aside>

        <StudentPersonalFields
          values={form}
          invalidFields={invalidFields}
          updateField={updateField}
          emailConflict={saveMutation.error?.message === "conflict"}
        />
        <StudentLearningFields
          values={form}
          invalidFields={invalidFields}
          updateField={updateField}
          currency={currency}
          minorFactor={minorFactor}
        />
        <div className="space-y-6 lg:col-start-2 lg:row-start-3 xl:col-span-2 xl:row-start-3">
          <StudentSettingsFields values={form} updateField={updateField} />

          {clientInvalidFields.length ? (
            <p role="alert" className="text-sm font-bold text-destructive">
              {t("errors.validation")}
            </p>
          ) : null}
          {saveMutation.isError && !mutationFields?.length ? (
            <p role="alert" className="text-sm font-bold text-destructive">
              {t(
                saveMutation.error.message === "conflict"
                  ? "errors.conflict"
                  : "errors.general",
              )}
            </p>
          ) : null}

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? t(isEditing ? "edit.saving" : "form.saving")
                : t(isEditing ? "edit.save" : "form.save")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
