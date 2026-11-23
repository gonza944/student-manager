"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useClassTimeline } from "@/app/students/hooks/use-class-timeline";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { VirtualTimeline } from "@/components/timeline/virtual-timeline";
import type {
  StudentClassDto,
  StudentClassTimeline,
} from "@/lib/classes/contracts";
import { ClassSummary } from "./class-summary";

export function ClassTimeline({
  studentId,
  initialData,
  version,
  timeZone,
  actions,
  isError,
  renderClass,
}: {
  studentId: string | undefined;
  initialData: StudentClassTimeline;
  version: string;
  timeZone: string;
  actions: ReactNode;
  isError: boolean;
  renderClass: (item: StudentClassDto, summary: ReactNode) => ReactNode;
}) {
  const t = useTranslations("Classes");
  const query = useClassTimeline(studentId, initialData, version);
  const desktop = useIsDesktop();
  const orientation = desktop ? "horizontal" : "vertical";
  const [now] = useState(() => Date.now());
  return (
    <>
      <VirtualTimeline
        key={orientation}
        items={query.classes}
        getKey={(item) => item.id}
        getTimestamp={(item) => Date.parse(item.scheduledAt)}
        orientation={orientation}
        now={now}
        label={t("timeline.label")}
        nowLabel={t("timeline.now")}
        onReachStart={
          query.hasPreviousPage && !query.isFetching && !query.isError
            ? () => {
                void query.fetchPreviousPage();
              }
            : undefined
        }
        onReachEnd={
          query.hasNextPage && !query.isFetching && !query.isError
            ? () => {
                void query.fetchNextPage();
              }
            : undefined
        }
        renderHeader={(goToNow) => (
          <>
            <CardHeader className="gap-4 md:grid-cols-[1fr_auto]">
              <CardTitle id="classes-title" className="text-2xl font-black">
                <h2>{t("title")}</h2>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToNow}
                  className="min-h-12 rounded-full"
                >
                  {t("timeline.goToNow")}
                </Button>
                {actions}
              </div>
            </CardHeader>
            {isError || query.isError ? (
              <p role="alert" className="px-6">
                {t("errors.general")}
              </p>
            ) : null}
            {!query.classes.length ? (
              <p className="px-6 text-muted-foreground">{t("empty")}</p>
            ) : null}
          </>
        )}
        renderItem={(item, context) =>
          renderClass(
            item,
            <ClassSummary
              studentClass={item}
              showStudentName={studentId === undefined}
              timeZone={timeZone}
              {...context}
            />,
          )
        }
      />
      <div className="flex flex-wrap gap-2 px-6">
        {query.isError ? (
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() =>
              void (query.isFetchPreviousPageError
                ? query.fetchPreviousPage()
                : query.fetchNextPage())
            }
          >
            {t("actions.retry")}
          </Button>
        ) : null}
        {query.hasNextPage ? (
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            {t("actions.later")}
          </Button>
        ) : null}
      </div>
    </>
  );
}
