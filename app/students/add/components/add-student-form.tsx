"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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
} from "@/lib/students/contracts";
import { studentCountries } from "@/lib/students/geography";
import { cn } from "@/lib/utils";

import { createStudentAction } from "../../actions";
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

export function AddStudentForm({
  currency,
  preplyCommissionBps,
}: {
  currency: string;
  preplyCommissionBps: number;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StudentForm>(initialForm);
  const [clientInvalid, setClientInvalid] = useState(false);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale],
  );
  const currencyFractionDigits =
    currencyFormatter.resolvedOptions().maximumFractionDigits ?? 2;
  const minorFactor = 10 ** currencyFractionDigits;
  const hourlyRateMinor = toMinorUnits(form.hourlyRate, currencyFractionDigits);
  const rates = calculateStudentRate(
    hourlyRateMinor,
    form.source,
    preplyCommissionBps,
  );
  const formatMoney = (minor: number) =>
    currencyFormatter.format(minor / minorFactor);
  const createMutation = useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const result = await createStudentAction(input);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm(initialForm);
      setClientInvalid(false);
      router.push("/students");
    },
  });

  return (
    <div className="p-4 sm:p-6 xl:p-7">
      <div className="mb-5 pe-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {t("form.eyebrow")}
        </p>
        <h1
          id="add-student-title"
          className="text-3xl font-black tracking-[-0.05em]">
          {t("form.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("form.description")}
        </p>
      </div>

      <form
        className="grid gap-6 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(16rem,0.7fr)_repeat(2,minmax(0,1fr))]"
        onSubmit={(event) => {
          event.preventDefault();
          setClientInvalid(false);

          const input = createStudentInputSchema.safeParse({
            ...form,
            hourlyRateMinor,
          });

          if (!input.success) {
            setClientInvalid(true);
            return;
          }

          createMutation.mutate(input.data);
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
          {form.source === "preply" ? (
            <p className="text-sm font-semibold text-muted-foreground self-center">
              {t("form.preplyRate", {
                fee: formatMoney(rates.platformFeeMinor),
                net: formatMoney(rates.netMinor),
              })}
            </p>
          ) : null}
        </aside>

        <fieldset className="lg:col-start-2 lg:row-start-1 xl:col-span-2">
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
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
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
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-phone">{t("form.phone")}</Label>
              <Input
                id="student-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-time-zone">{t("form.timeZone")}</Label>
              <StudentTimeZoneCombobox
                id="student-time-zone"
                value={form.timeZone}
                placeholder={t("form.timeZonePlaceholder")}
                emptyMessage={t("form.timeZoneNoResults")}
                openLabel={t("form.timeZoneOpen")}
                onValueChange={(timeZone) =>
                  setForm((current) => ({ ...current, timeZone }))
                }
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="lg:col-start-2 lg:row-start-2 xl:col-span-2">
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
                options={studentLevels.map((level) => ({
                  value: level,
                  label: level,
                }))}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, level: value }))
                }
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
                value={form.hourlyRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hourlyRate: event.target.value,
                  }))
                }
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="student-goals">{t("form.goals")}</Label>
              <textarea
                id="student-goals"
                name="learningGoals"
                maxLength={2_000}
                value={form.learningGoals}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    learningGoals: event.target.value,
                  }))
                }
                className="min-h-20 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-preferences">
                {t("form.preferences")}
              </Label>
              <StudentTagInput
                id="student-preferences"
                values={form.preferences}
                placeholder={t("form.preferencesPlaceholder")}
                removeLabel={(value) => t("form.removeTag", { value })}
                onValueChange={(preferences) =>
                  setForm((current) => ({ ...current, preferences }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-interests">{t("form.interests")}</Label>
              <StudentTagInput
                id="student-interests"
                values={form.interests}
                placeholder={t("form.interestsPlaceholder")}
                removeLabel={(value) => t("form.removeTag", { value })}
                onValueChange={(interests) =>
                  setForm((current) => ({ ...current, interests }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t("form.tagsHint")}
            </p>
          </div>
        </fieldset>

        <div className="space-y-6 lg:col-start-2 lg:row-start-3 xl:col-span-2 xl:row-start-3">
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

          {clientInvalid ? (
            <p role="alert" className="text-sm font-bold text-destructive">
              {t("errors.validation")}
            </p>
          ) : null}
          {createMutation.isError ? (
            <p role="alert" className="text-sm font-bold text-destructive">
              {t(
                createMutation.error.message === "conflict"
                  ? "errors.conflict"
                  : "errors.general",
              )}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => router.push("/students")}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("form.saving") : t("form.save")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
