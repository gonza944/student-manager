"use client";

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
import { studentTimeZones } from "@/lib/students/geography";

export function StudentTimeZoneCombobox({
  id,
  value,
  placeholder,
  emptyMessage,
  openLabel,
  invalid = false,
  onValueChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  emptyMessage: string;
  openLabel: string;
  invalid?: boolean;
  onValueChange: (timeZone: string) => void;
}) {
  return (
    <Combobox
      items={studentTimeZones}
      value={value}
      onValueChange={(timeZone: string | null) => {
        if (timeZone) onValueChange(timeZone);
      }}
      autoHighlight
      required>
      <ComboboxInputGroup className="h-11">
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
        <ComboboxTrigger aria-label={openLabel} />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(timeZone: string) => (
              <ComboboxItem key={timeZone} value={timeZone}>
                {timeZone.replaceAll("_", " ")}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
