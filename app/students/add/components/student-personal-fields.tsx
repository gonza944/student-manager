"use client";

import { useLocale, useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactChannels } from "@/lib/students/contracts";
import { studentCountries } from "@/lib/students/geography";

import { StudentBirthDatePicker } from "./student-birth-date-picker";
import { StudentCountryCombobox } from "./student-country-combobox";
import { StudentDropdown } from "./student-dropdown";
import { StudentFormFieldError } from "./student-form-field-error";
import type {
  StudentFormValues,
  UpdateStudentForm,
} from "../utils/student-form-model";
import { StudentTimeZoneCombobox } from "./student-time-zone-combobox";

export function StudentPersonalFields({
  values,
  invalidFields,
  updateField,
  emailConflict,
}: {
  values: StudentFormValues;
  invalidFields: ReadonlySet<string>;
  updateField: UpdateStudentForm;
  emailConflict: boolean;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const fieldError = t("errors.field");
  const preferredContactError =
    values.preferredContactChannel === "email"
      ? t("errors.preferredContactEmail")
      : values.preferredContactChannel === "phone" ||
          values.preferredContactChannel === "whatsapp"
        ? t("errors.preferredContactPhone")
        : fieldError;

  return (
    <fieldset className="lg:col-start-2 lg:row-start-1 xl:col-span-2">
      <legend className="mb-3 text-sm font-black">{t("form.personal")}</legend>
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
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-11 rounded-xl"
          />
          <StudentFormFieldError
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
            maxLength={320}
            aria-invalid={invalidFields.has("email")}
            aria-describedby={
              invalidFields.has("email") ? "student-email-error" : undefined
            }
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="h-11 rounded-xl"
          />
          <StudentFormFieldError
            id="student-email-error"
            invalid={invalidFields.has("email")}
            message={emailConflict ? t("errors.conflict") : fieldError}
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
              invalidFields.has("phone") ? "student-phone-error" : undefined
            }
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="h-11 rounded-xl"
          />
          <StudentFormFieldError
            id="student-phone-error"
            invalid={invalidFields.has("phone")}
            message={fieldError}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-birth-date">{t("form.birthDate")}</Label>
          <StudentBirthDatePicker
            value={values.birthDate}
            locale={locale}
            placeholder={t("form.birthDatePlaceholder")}
            openLabel={t("form.birthDateOpen")}
            invalid={invalidFields.has("birthDate")}
            describedBy={
              invalidFields.has("birthDate")
                ? "student-birth-date-error"
                : undefined
            }
            onValueChange={(birthDate) => updateField("birthDate", birthDate)}
          />
          <StudentFormFieldError
            id="student-birth-date-error"
            invalid={invalidFields.has("birthDate")}
            message={t("errors.birthDate")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-contact-channel">
            {t("form.preferredContact")}
          </Label>
          <StudentDropdown
            id="student-contact-channel"
            label={t("form.preferredContact")}
            value={values.preferredContactChannel}
            invalid={invalidFields.has("preferredContactChannel")}
            options={contactChannels.map((channel) => ({
              value: channel,
              label: t(`contactChannels.${channel}`),
            }))}
            onValueChange={(value) =>
              updateField("preferredContactChannel", value)
            }
          />
          <StudentFormFieldError
            id="student-contact-channel-error"
            invalid={invalidFields.has("preferredContactChannel")}
            message={preferredContactError}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-nationality">
            {t("form.nationality")}
          </Label>
          <StudentCountryCombobox
            id="student-nationality"
            locale={locale}
            value={values.nationalityCode}
            placeholder={t("form.nationalityPlaceholder")}
            emptyMessage={t("form.nationalityNoResults")}
            openLabel={t("form.nationalityOpen")}
            invalid={invalidFields.has("nationalityCode")}
            onValueChange={(nationalityCode) => {
              const country = studentCountries.find(
                (option) => option.code === nationalityCode,
              );
              updateField("nationalityCode", nationalityCode);
              updateField(
                "timeZone",
                country?.timeZones[0] ?? values.timeZone,
              );
            }}
          />
          <StudentFormFieldError
            id="student-nationality-error"
            invalid={invalidFields.has("nationalityCode")}
            message={fieldError}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-time-zone">{t("form.timeZone")}</Label>
          <StudentTimeZoneCombobox
            id="student-time-zone"
            value={values.timeZone}
            placeholder={t("form.timeZonePlaceholder")}
            emptyMessage={t("form.timeZoneNoResults")}
            openLabel={t("form.timeZoneOpen")}
            invalid={invalidFields.has("timeZone")}
            onValueChange={(timeZone) => updateField("timeZone", timeZone)}
          />
          <StudentFormFieldError
            id="student-time-zone-error"
            invalid={invalidFields.has("timeZone")}
            message={fieldError}
          />
        </div>
      </div>
    </fieldset>
  );
}
