"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { motion } from "motion/react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root asChild {...props}>
      <motion.button
        type="button"
        data-slot="animate-switch"
        whileTap={{ scale: 0.96 }}
        className={cn(
          "peer relative flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent bg-input px-0.5 shadow-xs outline-none transition-colors data-[state=checked]:justify-end data-[state=checked]:bg-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/80",
          className,
        )}>
        <SwitchPrimitive.Thumb asChild>
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 320, damping: 25 }}
            className="block size-5.5 rounded-full bg-background shadow-sm data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
          />
        </SwitchPrimitive.Thumb>
      </motion.button>
    </SwitchPrimitive.Root>
  );
}
