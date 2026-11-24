"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export function ThemeToggle({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="rounded-full"
      aria-label={label}
      title={label}
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", dark ? "dark" : "light");
      }}
    >
      <HugeiconsIcon
        icon={Moon02Icon}
        size={19}
        color="currentColor"
        strokeWidth={1.5}
        className="dark:hidden"
        aria-hidden="true"
      />
      <HugeiconsIcon
        icon={Sun03Icon}
        size={19}
        color="currentColor"
        strokeWidth={1.5}
        className="hidden dark:block"
        aria-hidden="true"
      />
    </Button>
  );
}
