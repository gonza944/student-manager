"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDateOnlyToday } from "@/lib/students/contracts";

import {
  formatDateInput,
  getDateInputLocale,
  parseDateInput,
  parseIsoDateOnly,
  toIsoDateOnly,
} from "../utils/date-only";

export function StudentDatePicker({
  id,
  name,
  value,
  locale,
  timeZone,
  placeholder,
  openLabel,
  invalid,
  describedBy,
  autoComplete,
  minDate,
  maxDate,
  required = false,
  onValueChange,
}: {
  id: string;
  name: string;
  value: string;
  locale: string;
  timeZone: string;
  placeholder: string;
  openLabel: string;
  invalid: boolean;
  describedBy?: string;
  autoComplete?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
}) {
  const dateLocale = getDateInputLocale(locale);
  const selectedDate = parseIsoDateOnly(value);
  const today = parseIsoDateOnly(getDateOnlyToday(timeZone) ?? "");
  const minimumDate = parseIsoDateOnly(minDate ?? "");
  const maximumDate = parseIsoDateOnly(maxDate ?? "") ?? today;
  const startMonth =
    minimumDate && maximumDate && minimumDate > maximumDate
      ? maximumDate
      : minimumDate ??
        (today ? new Date(today.getFullYear() - 120, 0, 1) : undefined);
  const formatDate = (date: Date) => formatDateInput(date, locale);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(
    selectedDate ?? maximumDate ?? today,
  );
  const formattedValue = selectedDate ? formatDate(selectedDate) : value;
  const [draft, setDraft] = useState({
    locale,
    value,
    text: formattedValue,
  });
  const inputValue =
    draft.locale === locale && draft.value === value
      ? draft.text
      : formattedValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup className="h-11 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 transition-[border-color,box-shadow,transform] focus-within:-translate-y-px focus-within:border-orbit-ink/60 focus-within:ring-4 focus-within:ring-orbit-ink/10">
        <InputGroupInput
          id={id}
          name={name}
          value={inputValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            const nextValue = event.target.value;
            const parsedDate = parseDateInput(nextValue, locale);
            let normalizedValue = nextValue;

            if (!nextValue.trim()) {
              normalizedValue = "";
            } else if (parsedDate) {
              normalizedValue = toIsoDateOnly(parsedDate);
              setMonth(parsedDate);
            }

            setDraft({ locale, value: normalizedValue, text: nextValue });
            onValueChange(normalizedValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end" className="py-0">
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="group size-11 rounded-full p-1 hover:bg-transparent hover:text-orbit-ink"
              aria-label={openLabel}>
              <span className="flex size-9 items-center justify-center rounded-full border border-orbit-ink bg-transparent text-orbit-ink transition-colors group-hover:bg-orbit-ink/5">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
              <span className="sr-only">{openLabel}</span>
            </InputGroupButton>
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="end"
        alignOffset={-8}
        sideOffset={10}>
        <Calendar
          mode="single"
          locale={dateLocale}
          captionLayout="dropdown"
          navLayout="after"
          reverseYears
          startMonth={startMonth}
          endMonth={maximumDate}
          today={today}
          selected={selectedDate}
          month={month}
          onMonthChange={setMonth}
          disabled={(date) =>
            (minimumDate ? date < minimumDate : false) ||
            (maximumDate ? date > maximumDate : false)
          }
          onSelect={(date) => {
            const nextValue = date ? toIsoDateOnly(date) : "";
            setDraft({
              locale,
              value: nextValue,
              text: date ? formatDate(date) : "",
            });
            onValueChange(nextValue);
            if (date) setMonth(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
