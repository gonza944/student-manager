"use client";

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import type { CSSProperties } from "react";

const icon = (source: typeof CheckmarkCircle02Icon, className = "size-4") => (
  <HugeiconsIcon
    icon={source}
    className={className}
    strokeWidth={2}
    aria-hidden="true"
  />
);

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: icon(CheckmarkCircle02Icon, "size-4 text-success"),
        info: icon(InformationCircleIcon, "size-4 text-blue-gray-600"),
        warning: icon(Alert02Icon, "size-4 text-yellow-500"),
        error: icon(MultiplicationSignCircleIcon, "size-4 text-destructive"),
        loading: icon(
          Loading03Icon,
          "size-4 animate-spin text-muted-foreground",
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
