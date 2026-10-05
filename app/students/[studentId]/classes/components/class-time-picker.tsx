"use client";

import { Clock03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";

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
import { cn } from "@/lib/utils";

const times = Array.from({ length: 24 * 12 }, (_, index) => {
  const hour = Math.floor(index / 12);
  const minute = (index % 12) * 5;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function formatTime(value: string, locale: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2020, 0, 1, hour, minute));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function ClassTimePicker({
  id,
  name,
  value,
  locale,
  openLabel,
  onValueChange,
}: {
  id: string;
  name: string;
  value: string;
  locale: string;
  openLabel: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedTime = useRef<HTMLButtonElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup className="h-11 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 transition-[border-color,box-shadow,transform] focus-within:-translate-y-px focus-within:border-orbit-ink/60 focus-within:ring-4 focus-within:ring-orbit-ink/10">
        <InputGroupInput
          id={id}
          name={name}
          value={formatTime(value, locale)}
          readOnly
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
                <HugeiconsIcon icon={Clock03Icon} strokeWidth={2} aria-hidden="true" />
              </span>
            </InputGroupButton>
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverContent
        className="max-h-72 w-80 overflow-y-auto p-1"
        align="end"
        alignOffset={-8}
        sideOffset={10}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          selectedTime.current?.scrollIntoView({ block: "center" });
          selectedTime.current?.focus();
        }}>
        <div className="grid grid-cols-3 gap-1">
          {times.map((time) => (
            <button
              key={time}
              ref={value === time ? selectedTime : undefined}
              type="button"
              className={cn(
                "rounded-lg px-3 py-2 text-start text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value === time && "bg-orbit-ink text-orbit-paper-strong hover:bg-orbit-ink",
              )}
              onClick={() => {
                onValueChange(time);
                setOpen(false);
              }}>
              {formatTime(time, locale)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
