"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import {
  ArrowDown01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        "flex h-12 w-full items-center rounded-xl border border-orbit-ink/20 bg-orbit-paper-strong/70 transition-[border-color,box-shadow,transform] focus-within:-translate-y-px focus-within:border-orbit-ink/60 focus-within:ring-4 focus-within:ring-orbit-ink/10 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "min-w-0 flex-1 bg-transparent px-4 text-base font-semibold outline-none placeholder:text-orbit-ink/45 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "group me-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-orbit-ink bg-transparent text-orbit-ink transition-colors hover:bg-orbit-ink/5 focus-visible:ring-3 focus-visible:ring-orbit-ink/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}>
      {children ?? (
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={18}
          strokeWidth={2.25}
          aria-hidden="true"
          className="transition-transform duration-200 group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
        />
      )}
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxContent({
  className,
  sideOffset = 6,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  sideOffset?: number;
}) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        sideOffset={sideOffset}
        align="start"
        className="isolate z-50">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-[combobox-fade-in_400ms_ease-out_both] data-closed:animate-[combobox-fade-out_300ms_ease-in_both] motion-reduce:animate-none",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default animate-[combobox-item-enter_250ms_ease-out_both] items-center rounded-md py-2 ps-2 pe-8 text-sm outline-hidden select-none [animation-delay:var(--combobox-item-delay,0ms)] data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 motion-reduce:animate-none",
        className,
      )}
      {...props}>
      {children}
      <ComboboxPrimitive.ItemIndicator className="pointer-events-none absolute end-2 flex size-4 items-center justify-center">
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} aria-hidden="true" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

const ComboboxGroup = ComboboxPrimitive.Group;
const ComboboxCollection = ComboboxPrimitive.Collection;

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 text-xs font-bold text-orbit-paper-strong/75 dark:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "px-4 py-2 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
};
