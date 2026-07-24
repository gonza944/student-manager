"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useContext,
  useId,
} from "react";

import { cn } from "@/lib/utils";

type ToggleGroupContextValue = {
  layoutId: string;
  value: string;
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export function ToggleGroup({
  className,
  value,
  children,
  ...props
}: Omit<ToggleGroupPrimitive.ToggleGroupSingleProps, "value"> & {
  value: string;
}) {
  const layoutId = useId();

  return (
    <ToggleGroupContext.Provider value={{ layoutId, value }}>
      <ToggleGroupPrimitive.Root
        data-slot="animate-toggle-group"
        className={cn(
          "flex w-fit items-center gap-1 rounded-xl border border-input bg-transparent p-1 shadow-xs",
          className,
        )}
        value={value}
        {...props}>
        {children}
      </ToggleGroupPrimitive.Root>
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem({
  className,
  children,
  value,
  ...props
}: ToggleGroupPrimitive.ToggleGroupItemProps) {
  const context = useContext(ToggleGroupContext);
  const selected = context?.value === value;

  return (
    <ToggleGroupPrimitive.Item value={value} asChild {...props}>
      <motion.button
        type="button"
        data-slot="animate-toggle-group-item"
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative isolate min-h-10 min-w-10 overflow-hidden rounded-lg px-3 text-sm font-semibold outline-none transition-colors hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          selected ? "text-accent-foreground" : "text-muted-foreground",
          className,
        )}>
        <AnimatePresence initial={false}>
          {selected ? (
            <motion.span
              aria-hidden="true"
              layoutId={context?.layoutId}
              className="absolute inset-0 -z-10 rounded-lg bg-accent"
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : null}
        </AnimatePresence>
        {children}
      </motion.button>
    </ToggleGroupPrimitive.Item>
  );
}
