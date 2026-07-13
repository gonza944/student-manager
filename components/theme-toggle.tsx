"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", dark ? "dark" : "light");
}

export function ThemeToggle({ label }: { label: string }) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const syncWithSystem = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) applyTheme(event.matches);
    };

    preference.addEventListener("change", syncWithSystem);
    return () => preference.removeEventListener("change", syncWithSystem);
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="rounded-full"
      aria-label={label}
      title={label}
      onClick={() => {
        const dark = !document.documentElement.classList.contains("dark");
        localStorage.setItem("theme", dark ? "dark" : "light");
        applyTheme(dark);
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
