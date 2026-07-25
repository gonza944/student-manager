"use client";

import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 768px)";

export function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(desktopQuery);
      mediaQuery.addEventListener("change", onChange);

      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
}
