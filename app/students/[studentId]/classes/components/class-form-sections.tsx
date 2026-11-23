"use client";

import { useState, type ReactNode } from "react";
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
  const [expanded, setExpanded] = useState(["schedule"]);
  return (
    <Accordion
      type="multiple"
      value={expanded}
      onValueChange={setExpanded}
      className="flex min-h-0 flex-1 flex-col overflow-hidden pe-1"
    >
      <AccordionItem
        value="schedule"
        className="flex min-h-14 basis-14 grow-0 shrink-0 flex-col transition-[flex-grow] duration-200 ease-out motion-reduce:transition-none data-[state=open]:grow-[2] [&>h3]:h-14 [&>h3]:shrink-0"
      >
        <AccordionTrigger>{t("sections.schedule")}</AccordionTrigger>
        <AccordionContent
          forceMount
          inert={!expanded.includes("schedule")}
          aria-hidden={!expanded.includes("schedule")}
          rootClassName="min-h-0 flex-1"
          className="flex h-full min-h-0 flex-col overflow-y-auto"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">{schedule}</div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="occupied"
        className="flex min-h-14 basis-14 grow-0 shrink-0 flex-col transition-[flex-grow] duration-200 ease-out motion-reduce:transition-none data-[state=open]:grow [&>h3]:h-14 [&>h3]:shrink-0"
      >
        <AccordionTrigger>{t("occupied")}</AccordionTrigger>
        <AccordionContent
          forceMount
          inert={!expanded.includes("occupied")}
          aria-hidden={!expanded.includes("occupied")}
          rootClassName="min-h-0 flex-1"
          className="h-full min-h-0 overflow-y-auto"
        >
          {occupied}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
