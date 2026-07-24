"use client";

import getCountryFlag from "country-flag-icons/unicode";
import { useMemo } from "react";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { studentCountries } from "@/lib/students/geography";

type CountryOption = {
  code: string;
  label: string;
};

export function StudentCountryCombobox({
  id,
  locale,
  value,
  placeholder,
  emptyMessage,
  openLabel,
  onValueChange,
}: {
  id: string;
  locale: string;
  value: string;
  placeholder: string;
  emptyMessage: string;
  openLabel: string;
  onValueChange: (countryCode: string) => void;
}) {
  const options = useMemo(() => {
    const names = new Intl.DisplayNames(locale, { type: "region" });
    const collator = new Intl.Collator(locale);

    return studentCountries
      .map((country) => ({
        code: country.code,
        label: names.of(country.code) ?? country.code,
      }))
      .toSorted((a, b) => collator.compare(a.label, b.label));
  }, [locale]);
  const selected = options.find((option) => option.code === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(option: CountryOption | null) => {
        if (option) onValueChange(option.code);
      }}
      itemToStringLabel={(option: CountryOption) => option.label}
      itemToStringValue={(option: CountryOption) => option.code}
      autoHighlight
      required>
      <ComboboxInputGroup className="h-11">
        <ComboboxInput id={id} placeholder={placeholder} />
        <ComboboxTrigger aria-label={openLabel} />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(option: CountryOption) => (
              <ComboboxItem key={option.code} value={option}>
                <span aria-hidden="true">{getCountryFlag(option.code)}</span>
                <span>{option.label}</span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
