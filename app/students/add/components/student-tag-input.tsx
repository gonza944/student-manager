"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StudentTagInput({
  id,
  values,
  placeholder,
  removeLabel,
  onValueChange,
}: {
  id: string;
  values: string[];
  placeholder: string;
  removeLabel: (value: string) => string;
  onValueChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const nextValue = draft.trim();
    if (!nextValue) return;

    const duplicate = values.some(
      (value) => value.toLocaleLowerCase() === nextValue.toLocaleLowerCase(),
    );
    if (!duplicate && values.length < 20) {
      onValueChange([...values, nextValue]);
    }
    setDraft("");
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-input bg-transparent p-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="min-h-7 ps-2.5 pe-1">
          {value}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={removeLabel(value)}
            className="size-5 rounded-full"
            onClick={() =>
              onValueChange(values.filter((current) => current !== value))
            }>
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
          </Button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={values.length ? undefined : placeholder}
        enterKeyHint="done"
        maxLength={80}
        className="h-8 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={addDraft}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addDraft();
          } else if (event.key === "Backspace" && !draft && values.length) {
            onValueChange(values.slice(0, -1));
          }
        }}
      />
    </div>
  );
}
