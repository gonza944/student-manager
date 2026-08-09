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
  placeholder,
  openLabel,
  invalid,
  describedBy,
  onValueChange,
}: {
  value: string;
  locale: string;
  placeholder: string;
  openLabel: string;
  invalid: boolean;
  describedBy?: string;
  onValueChange: (value: string) => void;
}) {
  const dateLocale = getDateInputLocale(locale);
  const selectedDate = parseIsoDateOnly(value);
  const today = parseIsoDateOnly(new Date().toISOString().slice(0, 10));
  const formatDate = (date: Date) => formatDateInput(date, locale);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(selectedDate ?? today);
  const [inputValue, setInputValue] = useState(() =>
    selectedDate ? formatDate(selectedDate) : value,
  );

  return (
    <InputGroup className="h-11 rounded-xl">
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
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              aria-label={openLabel}>
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              <span className="sr-only">{openLabel}</span>
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}>
            <Calendar
              mode="single"
              locale={dateLocale}
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
      </InputGroupAddon>
    </InputGroup>
  );
}
