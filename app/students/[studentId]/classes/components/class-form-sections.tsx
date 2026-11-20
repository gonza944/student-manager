"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ClassFormSections({
  schedule,
  occupied,
}: {
  schedule: ReactNode;
  occupied: ReactNode;
}) {
  const t = useTranslations("Classes");
  return (
    <Accordion
      type="multiple"
      defaultValue={["schedule"]}
      className="flex min-h-0 flex-1 flex-col overflow-hidden pe-1"
    >
      <AccordionItem
        value="schedule"
        className="flex min-h-0 shrink-0 flex-col data-[state=open]:flex-[2]"
      >
        <AccordionTrigger>{t("sections.schedule")}</AccordionTrigger>
        <AccordionContent
          rootClassName="min-h-0 flex-1"
          className="flex h-full min-h-0 flex-col overflow-y-auto"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">{schedule}</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="occupied"
        className="flex min-h-0 shrink-0 flex-col data-[state=open]:flex-1"
      >
        <AccordionTrigger>{t("occupied")}</AccordionTrigger>
        <AccordionContent
          rootClassName="min-h-0 flex-1"
          className="h-full min-h-0 overflow-y-auto"
        >
          {occupied}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
