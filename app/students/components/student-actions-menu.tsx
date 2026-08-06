"use client";

import {
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  UserCheck01Icon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudentActionsMenu({
  name,
  isActive,
  pending,
  editHref,
  onStatusChange,
  onDelete,
}: {
  name: string;
  isActive: boolean;
  pending: boolean;
  editHref: string;
  onStatusChange: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Students");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={pending}
          aria-label={t("studentActions", { name })}
          className="group size-8 rounded-full border border-orbit-ink/50 bg-transparent text-orbit-ink shadow-none backdrop-blur-sm hover:bg-orbit-paper-strong/25 hover:text-orbit-ink">
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="transition-transform duration-300 group-data-[state=open]:rotate-45 motion-reduce:transition-none"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto py-4 duration-300 data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0 data-[side=top]:slide-in-from-bottom-0 data-open:fade-in-0 data-open:zoom-in-100 data-closed:fade-out-0 data-closed:zoom-out-100 motion-reduce:duration-0">
        <DropdownMenuItem asChild className="py-2">
          <Link href={editHref}>
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("edit.action")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onStatusChange} className="py-2">
          <HugeiconsIcon
            icon={isActive ? UserMinus01Icon : UserCheck01Icon}
            strokeWidth={2}
            aria-hidden="true"
          />
          {isActive ? t("deactivate") : t("activate")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
            aria-hidden="true"
          />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
