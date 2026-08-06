"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/animate-ui/components/radix/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/animate-ui/components/radix/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateStudentRate,
  contactChannels,
  createStudentInputSchema,
  studentAvatarKeys,
  studentLevels,
  studentSources,
  studentThemeColors,
  type CreateStudentInput,
  type StudentDto,
} from "@/lib/students/contracts";
import { studentCountries } from "@/lib/students/geography";
import { cn } from "@/lib/utils";

import { createStudentAction, updateStudentAction } from "../../actions";
import { StudentCard } from "../../components/student-card";
import { studentThemeSwatches } from "../../const/student-card-config";
import { toMinorUnits } from "../../utils/to-minor-units";
import { StudentCountryCombobox } from "./student-country-combobox";
import { StudentDropdown } from "./student-dropdown";
import { StudentTagInput } from "./student-tag-input";
import { StudentTimeZoneCombobox } from "./student-time-zone-combobox";

type StudentForm = {
  name: string;
  email: string;
  phone: string;
  nationalityCode: string;
  timeZone: string;
  preferredContactChannel: (typeof contactChannels)[number];
  level: (typeof studentLevels)[number];
  preferences: string[];
  interests: string[];
  learningGoals: string;
  source: (typeof studentSources)[number];
  hourlyRate: string;
  isActive: boolean;
  avatarKey: (typeof studentAvatarKeys)[number];
  themeColor: (typeof studentThemeColors)[number];
};

const initialForm: StudentForm = {
  name: "",
  email: "",
  phone: "",
  nationalityCode: "AR",
  timeZone: "America/Argentina/Buenos_Aires",
  preferredContactChannel: "email",
  level: "A1",
  preferences: [],
  interests: [],
  learningGoals: "",
  source: "private",
  hourlyRate: "20",
  isActive: true,
  avatarKey: "avatar-01",
  themeColor: "coral",
};

type StudentFormError = Error & { fields?: string[] };

function FieldError({
  invalid,
  id,
  message,
}: {
  invalid: boolean;
  id: string;
  message: string;
}) {
  return invalid ? (
    <p id={id} className="text-xs font-bold text-destructive">
      {message}
    </p>
  ) : null;
}

export function StudentForm({
  currency,
  preplyCommissionBps,
  student,
}: {
  currency: string;
  preplyCommissionBps: number;
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
  const [form, setForm] = useState<StudentForm>(() =>
    student
      ? {
          name: student.name,
          email: student.email,
          phone: student.phone ?? "",
          nationalityCode: student.nationalityCode,
          timeZone: student.timeZone,
          preferredContactChannel: student.preferredContactChannel,
          level: student.level,
          preferences: student.preferences,
          interests: student.interests,
          learningGoals: student.learningGoals ?? "",
          source: student.source,
          hourlyRate: (student.hourlyRateMinor / minorFactor).toString(),
          isActive: student.isActive,
          avatarKey: student.avatarKey,
          themeColor: student.themeColor,
        }
      : initialForm,
  );
  const [clientInvalidFields, setClientInvalidFields] = useState<string[]>([]);
  const hourlyRateMinor = toMinorUnits(form.hourlyRate, currencyFractionDigits);
  const rates = calculateStudentRate(
    hourlyRateMinor,
    form.source,
    preplyCommissionBps,
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
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm(initialForm);
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
  const fieldError = t("errors.field");
  const emailError =
    saveMutation.error?.message === "conflict"
      ? t("errors.conflict")
      : fieldError;

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
        className={cn(
          "grid gap-6",
          !isEditing &&
            "lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(16rem,0.7fr)_repeat(2,minmax(0,1fr))]",
        )}
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
        {isEditing ? null : (
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
            {form.source === "preply" ? (
              <p className="self-center text-sm font-semibold text-muted-foreground">
                {t("form.preplyRate", {
                  fee: formatMoney(rates.platformFeeMinor),
                  net: formatMoney(rates.netMinor),
                })}
              </p>
            ) : null}
          </aside>
        )}

        <fieldset
          className={cn(
            !isEditing && "lg:col-start-2 lg:row-start-1 xl:col-span-2",
          )}>
          <legend className="mb-3 text-sm font-black">
            {t("form.personal")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="student-name">{t("form.name")}</Label>
              <Input
                id="student-name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                aria-invalid={invalidFields.has("name")}
                aria-describedby={
                  invalidFields.has("name") ? "student-name-error" : undefined
                }
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
              <FieldError
                id="student-name-error"
                invalid={invalidFields.has("name")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">{t("form.email")}</Label>
              <Input
                id="student-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                aria-invalid={invalidFields.has("email")}
                aria-describedby={
                  invalidFields.has("email")
                    ? "student-email-error"
                    : undefined
                }
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
              <FieldError
                id="student-email-error"
                invalid={invalidFields.has("email")}
                message={emailError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-phone">{t("form.phone")}</Label>
              <Input
                id="student-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                aria-invalid={invalidFields.has("phone")}
                aria-describedby={
                  invalidFields.has("phone")
                    ? "student-phone-error"
                    : undefined
                }
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
              <FieldError
                id="student-phone-error"
                invalid={invalidFields.has("phone")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-contact-channel">
                {t("form.preferredContact")}
              </Label>
              <StudentDropdown
                id="student-contact-channel"
                label={t("form.preferredContact")}
                value={form.preferredContactChannel}
                invalid={invalidFields.has("preferredContactChannel")}
                options={contactChannels.map((channel) => ({
                  value: channel,
                  label: t(`contactChannels.${channel}`),
                }))}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    preferredContactChannel: value,
                  }))
                }
              />
              <FieldError
                id="student-contact-channel-error"
                invalid={invalidFields.has("preferredContactChannel")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-nationality">
                {t("form.nationality")}
              </Label>
              <StudentCountryCombobox
                id="student-nationality"
                locale={locale}
                value={form.nationalityCode}
                placeholder={t("form.nationalityPlaceholder")}
                emptyMessage={t("form.nationalityNoResults")}
                openLabel={t("form.nationalityOpen")}
                invalid={invalidFields.has("nationalityCode")}
                onValueChange={(nationalityCode) => {
                  const country = studentCountries.find(
                    (option) => option.code === nationalityCode,
                  );
                  setForm((current) => ({
                    ...current,
                    nationalityCode,
                    timeZone: country?.timeZones[0] ?? current.timeZone,
                  }));
                }}
              />
              <FieldError
                id="student-nationality-error"
                invalid={invalidFields.has("nationalityCode")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-time-zone">{t("form.timeZone")}</Label>
              <StudentTimeZoneCombobox
                id="student-time-zone"
                value={form.timeZone}
                placeholder={t("form.timeZonePlaceholder")}
                emptyMessage={t("form.timeZoneNoResults")}
                openLabel={t("form.timeZoneOpen")}
                invalid={invalidFields.has("timeZone")}
                onValueChange={(timeZone) =>
                  setForm((current) => ({ ...current, timeZone }))
                }
              />
              <FieldError
                id="student-time-zone-error"
                invalid={invalidFields.has("timeZone")}
                message={fieldError}
              />
            </div>
          </div>
        </fieldset>

        <fieldset
          className={cn(
            !isEditing && "lg:col-start-2 lg:row-start-2 xl:col-span-2",
          )}>
          <legend className="mb-3 text-sm font-black">
            {t("form.learning")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student-level">{t("form.level")}</Label>
              <StudentDropdown
                id="student-level"
                label={t("form.level")}
                value={form.level}
                invalid={invalidFields.has("level")}
                options={studentLevels.map((level) => ({
                  value: level,
                  label: level,
                }))}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, level: value }))
                }
              />
              <FieldError
                id="student-level-error"
                invalid={invalidFields.has("level")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-rate">
                {t("form.rate", { currency })}
              </Label>
              <Input
                id="student-rate"
                name="hourlyRate"
                type="number"
                inputMode="decimal"
                required
                min={1 / minorFactor}
                step={1 / minorFactor}
                aria-invalid={invalidFields.has("hourlyRateMinor")}
                aria-describedby={
                  invalidFields.has("hourlyRateMinor")
                    ? "student-rate-error"
                    : undefined
                }
                value={form.hourlyRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hourlyRate: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
              <FieldError
                id="student-rate-error"
                invalid={invalidFields.has("hourlyRateMinor")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="student-goals">{t("form.goals")}</Label>
              <textarea
                id="student-goals"
                name="learningGoals"
                maxLength={2_000}
                aria-invalid={invalidFields.has("learningGoals")}
                aria-describedby={
                  invalidFields.has("learningGoals")
                    ? "student-goals-error"
                    : undefined
                }
                value={form.learningGoals}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    learningGoals: event.target.value,
                  }))
                }
                className="min-h-20 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
              <FieldError
                id="student-goals-error"
                invalid={invalidFields.has("learningGoals")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-preferences">
                {t("form.preferences")}
              </Label>
              <StudentTagInput
                id="student-preferences"
                values={form.preferences}
                invalid={invalidFields.has("preferences")}
                placeholder={t("form.preferencesPlaceholder")}
                removeLabel={(value) => t("form.removeTag", { value })}
                onValueChange={(preferences) =>
                  setForm((current) => ({ ...current, preferences }))
                }
              />
              <FieldError
                id="student-preferences-error"
                invalid={invalidFields.has("preferences")}
                message={fieldError}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-interests">{t("form.interests")}</Label>
              <StudentTagInput
                id="student-interests"
                values={form.interests}
                invalid={invalidFields.has("interests")}
                placeholder={t("form.interestsPlaceholder")}
                removeLabel={(value) => t("form.removeTag", { value })}
                onValueChange={(interests) =>
                  setForm((current) => ({ ...current, interests }))
                }
              />
              <FieldError
                id="student-interests-error"
                invalid={invalidFields.has("interests")}
                message={fieldError}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t("form.tagsHint")}
            </p>
          </div>
        </fieldset>

        <div
          className={cn(
            "space-y-6",
            !isEditing &&
              "lg:col-start-2 lg:row-start-3 xl:col-span-2 xl:row-start-3",
          )}>
          <fieldset>
            <legend className="mb-3 text-sm font-black">
              {t("form.source")}
            </legend>
            <div className="grid gap-3 min-[420px]:grid-cols-[minmax(0,1fr)_auto]">
              <ToggleGroup
                type="single"
                value={form.source}
                aria-label={t("form.source")}
                className="grid w-full grid-cols-2"
                onValueChange={(source) => {
                  if (source) {
                    setForm((current) => ({
                      ...current,
                      source: source as StudentForm["source"],
                    }));
                  }
                }}>
                {studentSources.map((source) => (
                  <ToggleGroupItem
                    key={source}
                    value={source}
                    className="w-full">
                    {t(`sources.${source}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="flex min-h-11 items-center gap-3 rounded-xl px-3">
                <Switch
                  id="student-active"
                  checked={form.isActive}
                  onCheckedChange={(isActive) =>
                    setForm((current) => ({ ...current, isActive }))
                  }
                />
                <Label
                  htmlFor="student-active"
                  className="cursor-pointer whitespace-nowrap">
                  {t("form.active")}
                </Label>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-black">
              {t("form.avatar")}
            </legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-[repeat(16,minmax(0,1fr))]">
              {studentAvatarKeys.map((avatarKey, index) => (
                <Label key={avatarKey} className="block w-full cursor-pointer">
                  <input
                    type="radio"
                    name="student-avatar"
                    value={avatarKey}
                    checked={form.avatarKey === avatarKey}
                    onChange={() =>
                      setForm((current) => ({ ...current, avatarKey }))
                    }
                    className="peer sr-only"
                  />
                  <span className="relative block aspect-square w-full overflow-hidden rounded-xl border-2 border-transparent bg-muted peer-checked:border-orbit-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    <Image
                      src={`/avatars/open-peeps/${avatarKey}.svg`}
                      alt={t("form.avatarOption", { number: index + 1 })}
                      fill
                      sizes="4rem"
                      className="object-contain"
                    />
                  </span>
                </Label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-black">
              {t("form.color")}
            </legend>
            <ToggleGroup
              type="single"
              value={form.themeColor}
              aria-label={t("form.color")}
              className="flex-wrap border-none"
              onValueChange={(themeColor) => {
                if (themeColor) {
                  setForm((current) => ({
                    ...current,
                    themeColor: themeColor as StudentForm["themeColor"],
                  }));
                }
              }}>
              {studentThemeColors.map((themeColor) => (
                <ToggleGroupItem
                  key={themeColor}
                  value={themeColor}
                  aria-label={t(`colors.${themeColor}`)}
                  title={t(`colors.${themeColor}`)}
                  className="size-11 p-1.5">
                  <span
                    className={cn(
                      "block size-full rounded-full ring-1 ring-orbit-ink/20",
                      studentThemeSwatches[themeColor],
                    )}>
                    <span className="sr-only">{t(`colors.${themeColor}`)}</span>
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>

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
