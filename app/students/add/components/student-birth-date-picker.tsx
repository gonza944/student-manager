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

export function StudentBirthDatePicker({
  value,
  locale,
  timeZone,
  placeholder,
  openLabel,
  invalid,
  describedBy,
  onValueChange,
}: {
  value: string;
  locale: string;
  timeZone: string;
  placeholder: string;
  openLabel: string;
  invalid: boolean;
  describedBy?: string;
  onValueChange: (value: string) => void;
}) {
  const dateLocale = getDateInputLocale(locale);
  const selectedDate = parseIsoDateOnly(value);
  const today = parseIsoDateOnly(getDateOnlyToday(timeZone) ?? "");
  const startMonth = today
    ? new Date(today.getFullYear() - 120, 0, 1)
    : undefined;
  const formatDate = (date: Date) => formatDateInput(date, locale);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(selectedDate ?? today);
  const [inputValue, setInputValue] = useState(() =>
    selectedDate ? formatDate(selectedDate) : value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup className="h-11 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 transition-[border-color,box-shadow,transform] focus-within:-translate-y-px focus-within:border-orbit-ink/60 focus-within:ring-4 focus-within:ring-orbit-ink/10">
        <InputGroupInput
          id="student-birth-date"
          name="birthDate"
          value={inputValue}
          placeholder={placeholder}
          autoComplete="bday"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            const nextValue = event.target.value;
            const parsedDate = parseDateInput(nextValue, locale);

            setInputValue(nextValue);
            if (!nextValue.trim()) {
              onValueChange("");
            } else if (parsedDate) {
              onValueChange(toIsoDateOnly(parsedDate));
              setMonth(parsedDate);
            } else {
              onValueChange(nextValue);
            }
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
          endMonth={today}
          today={today}
          selected={selectedDate}
          month={month}
          onMonthChange={setMonth}
          disabled={today ? { after: today } : undefined}
          onSelect={(date) => {
            onValueChange(date ? toIsoDateOnly(date) : "");
            setInputValue(date ? formatDate(date) : "");
            if (date) setMonth(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
