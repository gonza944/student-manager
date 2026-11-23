import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClassTimelineMenuItem = {
  id: string;
  label: string;
  icon: IconSvgElement;
  variant?: "destructive";
} & (
  | { href: string; onSelect?: never }
  | { href?: never; onSelect: (event: Event) => void }
);

export function ClassTimelineMenu({
  summary,
  disabled,
  items,
}: {
  summary: ReactNode;
  disabled: boolean;
  items: readonly ClassTimelineMenuItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="relative flex w-full flex-col items-center rounded-xl p-3 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {summary}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-2">
        {items.map(({ id, label, icon, variant, href, onSelect }) => {
          const content = (
            <>
              <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
              {label}
            </>
          );

          return (
            <DropdownMenuItem
              key={id}
              asChild={href !== undefined}
              className="py-2"
              onSelect={onSelect}
              variant={variant}
            >
              {href === undefined ? content : <Link href={href}>{content}</Link>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
