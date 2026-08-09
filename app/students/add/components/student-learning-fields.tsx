"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentLevels } from "@/lib/students/contracts";

import { StudentDropdown } from "./student-dropdown";
import { StudentFormFieldError } from "./student-form-field-error";
import type {
  StudentFormValues,
  UpdateStudentForm,
} from "../utils/student-form-model";
import { StudentTagInput } from "./student-tag-input";

export function StudentLearningFields({
  values,
  invalidFields,
  updateField,
  currency,
  minorFactor,
}: {
  values: StudentFormValues;
  invalidFields: ReadonlySet<string>;
  updateField: UpdateStudentForm;
  currency: string;
  minorFactor: number;
}) {
  const t = useTranslations("Students");
  const fieldError = t("errors.field");

  return (
    <fieldset className="lg:col-start-2 lg:row-start-2 xl:col-span-2">
      <legend className="mb-3 text-sm font-black">{t("form.learning")}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="student-level">{t("form.level")}</Label>
          <StudentDropdown
            id="student-level"
            label={t("form.level")}
            value={values.level}
            invalid={invalidFields.has("level")}
            options={studentLevels.map((level) => ({
              value: level,
              label: level,
            }))}
            onValueChange={(value) => updateField("level", value)}
          />
          <StudentFormFieldError
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
            value={values.hourlyRate}
            onChange={(event) =>
              updateField("hourlyRate", event.target.value)
            }
            className="h-11 rounded-xl"
          />
          <StudentFormFieldError
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
            value={values.learningGoals}
            onChange={(event) =>
              updateField("learningGoals", event.target.value)
            }
            className="min-h-20 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          />
          <StudentFormFieldError
            id="student-goals-error"
            invalid={invalidFields.has("learningGoals")}
            message={fieldError}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-preferences">{t("form.preferences")}</Label>
          <StudentTagInput
            id="student-preferences"
            values={values.preferences}
            invalid={invalidFields.has("preferences")}
            placeholder={t("form.preferencesPlaceholder")}
            removeLabel={(value) => t("form.removeTag", { value })}
            onValueChange={(preferences) =>
              updateField("preferences", preferences)
            }
          />
          <StudentFormFieldError
            id="student-preferences-error"
            invalid={invalidFields.has("preferences")}
            message={fieldError}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-interests">{t("form.interests")}</Label>
          <StudentTagInput
            id="student-interests"
            values={values.interests}
            invalid={invalidFields.has("interests")}
            placeholder={t("form.interestsPlaceholder")}
            removeLabel={(value) => t("form.removeTag", { value })}
            onValueChange={(interests) => updateField("interests", interests)}
          />
          <StudentFormFieldError
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
  );
}
