"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/animate-ui/components/radix/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/animate-ui/components/radix/toggle-group";
import { Label } from "@/components/ui/label";
import {
  studentAvatarKeys,
  studentSources,
  studentThemeColors,
} from "@/lib/students/contracts";
import { cn } from "@/lib/utils";

import { studentThemeSwatches } from "../../const/student-card-config";
import type {
  StudentFormValues,
  UpdateStudentForm,
} from "../utils/student-form-model";

export function StudentSettingsFields({
  values,
  updateField,
}: {
  values: StudentFormValues;
  updateField: UpdateStudentForm;
}) {
  const t = useTranslations("Students");

  return (
    <>
      <fieldset>
        <legend className="mb-3 text-sm font-black">{t("form.source")}</legend>
        <div className="grid gap-3 min-[420px]:grid-cols-[minmax(0,1fr)_auto]">
          <ToggleGroup
            type="single"
            value={values.source}
            aria-label={t("form.source")}
            className="grid w-full grid-cols-2"
            onValueChange={(source) => {
              if (source) {
                updateField("source", source as StudentFormValues["source"]);
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
              checked={values.isActive}
              onCheckedChange={(isActive) =>
                updateField("isActive", isActive)
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
        <legend className="mb-3 text-sm font-black">{t("form.avatar")}</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 xl:grid-cols-[repeat(16,minmax(0,1fr))]">
          {studentAvatarKeys.map((avatarKey, index) => (
            <Label key={avatarKey} className="block w-full cursor-pointer">
              <input
                type="radio"
                name="student-avatar"
                value={avatarKey}
                checked={values.avatarKey === avatarKey}
                onChange={() => updateField("avatarKey", avatarKey)}
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
        <legend className="mb-3 text-sm font-black">{t("form.color")}</legend>
        <ToggleGroup
          type="single"
          value={values.themeColor}
          aria-label={t("form.color")}
          className="flex-wrap border-none"
          onValueChange={(themeColor) => {
            if (themeColor) {
              updateField(
                "themeColor",
                themeColor as StudentFormValues["themeColor"],
              );
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
    </>
  );
}
