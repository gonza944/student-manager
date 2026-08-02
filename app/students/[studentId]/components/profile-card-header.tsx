import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import {
  CardAction,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileCardHeader({
  title,
  icon,
}: {
  title: string;
  icon?: IconSvgElement;
}) {
  return (
    <CardHeader>
      <CardTitle className="text-3xl font-black tracking-[-0.06em] sm:text-4xl">
        <h2>{title}</h2>
      </CardTitle>
      {icon ? (
        <CardAction className="grid size-11 place-items-center rounded-full border border-current/25">
          <HugeiconsIcon
            icon={icon}
            size={22}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </CardAction>
      ) : null}
    </CardHeader>
  );
}
