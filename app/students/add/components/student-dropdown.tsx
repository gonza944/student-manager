"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudentDropdown<Value extends string>({
  id,
  label,
  value,
  options,
  invalid = false,
  onValueChange,
}: {
  id: string;
  label: string;
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  invalid?: boolean;
  onValueChange: (value: Value) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="ghost"
          aria-label={`${label}: ${selected?.label ?? value}`}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className="group h-12 w-full justify-between rounded-xl border border-input bg-paper-strong/70 ps-4 pe-1 text-base font-semibold text-foreground shadow-none transition-[border-color,box-shadow,transform] hover:bg-paper-strong hover:text-foreground focus-visible:-translate-y-px focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 dark:hover:bg-input/40">
          {selected?.label ?? value}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-current bg-transparent transition-colors group-hover:bg-foreground/5">
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={18}
              strokeWidth={2.25}
              aria-hidden="true"
              className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as Value)}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="min-h-10 px-3">
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
