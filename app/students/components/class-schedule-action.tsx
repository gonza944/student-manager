import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { dashboardClassFormSearch } from "@/app/students/classes/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClassScheduleScope =
  | { studentId: string; studentIsActive: boolean }
  | { studentId?: undefined; activeStudents: { id: string; name: string }[] };

export function ClassScheduleAction(scope: ClassScheduleScope) {
  const t = useTranslations("Classes");
  const buttonClassName = "min-h-12 rounded-full bg-transparent";
  const label = (
    <>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} aria-hidden="true" />
      {t("actions.add")}
    </>
  );
  const enabled = scope.studentId === undefined
    ? scope.activeStudents.length > 0
    : scope.studentIsActive;

  if (!enabled) {
    return <Button disabled variant="outline" className={buttonClassName}>{label}</Button>;
  }

  if (scope.studentId !== undefined) {
    return (
      <Button asChild variant="outline" className={buttonClassName}>
        <Link href={`/students/${scope.studentId}/classes/add`}>{label}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={buttonClassName}>{label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2">
        <DropdownMenuLabel>{t("actions.chooseStudent")}</DropdownMenuLabel>
        {scope.activeStudents.map((student) => (
          <DropdownMenuItem key={student.id} asChild className="py-2">
            <Link href={`/students/${student.id}/classes/add${dashboardClassFormSearch}`} prefetch={false}>
              <span className="min-w-0 wrap-break-word">{student.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
