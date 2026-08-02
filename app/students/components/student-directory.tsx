"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { Switch } from "@/components/animate-ui/components/radix/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  StudentCursor,
  StudentCardDto,
  StudentListPage,
} from "@/lib/students/contracts";

import {
  deleteStudentAction,
  setStudentActiveAction,
} from "../actions";
import { useStudentsQuery } from "../hooks/use-students-query";
import {
  useStudentDirectoryStore,
  type StudentSort,
} from "../store/student-store";
import { DeleteStudentConfirmation } from "./delete-student-confirmation";
import { StudentCard } from "./student-card";

const actionErrorKeys: Record<
  string,
  | "errors.validation"
  | "errors.conflict"
  | "errors.permission"
  | "errors.notFound"
> = {
  validation: "errors.validation",
  conflict: "errors.conflict",
  unauthenticated: "errors.permission",
  forbidden: "errors.permission",
  notFound: "errors.notFound",
};

const gridMetrics = {
  cardWidth: 288,
  cardHeight: 400,
  gap: 16,
} as const;
const gridStyles = {
  "--student-card-width": `${gridMetrics.cardWidth}px`,
  "--student-card-height": `${gridMetrics.cardHeight}px`,
  "--student-grid-gap": `${gridMetrics.gap}px`,
} as CSSProperties;

export function StudentDirectory({
  initialData,
}: {
  initialData: StudentListPage;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const search = useStudentDirectoryStore((state) => state.search);
  const sort = useStudentDirectoryStore((state) => state.sort);
  const hideInactive = useStudentDirectoryStore((state) => state.hideInactive);
  const setSearch = useStudentDirectoryStore((state) => state.setSearch);
  const setSort = useStudentDirectoryStore((state) => state.setSort);
  const setHideInactive = useStudentDirectoryStore(
    (state) => state.setHideInactive,
  );
  const resetFilters = useStudentDirectoryStore((state) => state.resetFilters);
  const [studentToDelete, setStudentToDelete] = useState<StudentCardDto | null>(
    null,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const studentsQuery = useStudentsQuery({
    initialData,
    search,
    sort,
    hideInactive,
  });

  const directory = studentsQuery.data?.pages[0] ?? initialData;
  const students = useMemo(
    () => studentsQuery.data?.pages.flatMap((page) => page.students) ?? [],
    [studentsQuery.data],
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: directory.currency,
      }),
    [directory.currency, locale],
  );
  const fractionDigits =
    currencyFormatter.resolvedOptions().maximumFractionDigits ?? 2;
  const minorFactor = 10 ** fractionDigits;
  const formatMoney = (minor: number) =>
    currencyFormatter.format(minor / minorFactor);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    const observer = new ResizeObserver(updateWidth);
    updateWidth();
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const columns = Math.max(
    1,
    Math.floor(
      (viewportWidth + gridMetrics.gap) /
        (gridMetrics.cardWidth + gridMetrics.gap),
    ),
  );
  const rowCount = Math.ceil(students.length / columns);
  // TanStack Virtual deliberately exposes mutable measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => gridMetrics.cardHeight + gridMetrics.gap,
    overscan: 2,
    getItemKey: (index) =>
      students[index * columns]?.id ?? `student-row-${index}`,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVirtualRow = virtualRows.at(-1);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = studentsQuery;

  useEffect(() => {
    if (
      lastVirtualRow &&
      lastVirtualRow.index >= rowCount - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastVirtualRow,
    rowCount,
  ]);

  const refreshStudentPages = async () => {
    queryClient.setQueriesData<
      InfiniteData<StudentListPage, StudentCursor | null>
    >({ queryKey: ["students"] }, (data) =>
      data
        ? {
            pages: data.pages.slice(0, 1),
            pageParams: data.pageParams.slice(0, 1),
          }
        : data,
    );
    await queryClient.invalidateQueries({ queryKey: ["students"] });
  };
  const statusMutation = useMutation({
    mutationFn: async (student: StudentCardDto) => {
      const result = await setStudentActiveAction({
        studentId: student.id,
        isActive: !student.isActive,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: refreshStudentPages,
  });
  const deleteMutation = useMutation({
    mutationFn: async (student: StudentCardDto) => {
      const result = await deleteStudentAction({ studentId: student.id });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setStudentToDelete(null);
      await refreshStudentPages();
    },
  });

  const mutationError = statusMutation.error ?? deleteMutation.error;
  const mutationErrorKey = mutationError
    ? (actionErrorKeys[mutationError.message] ?? "errors.general")
    : null;
  const filtersHideResults = search.trim() !== "" || hideInactive;

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[90rem]">
        <nav
          className="flex items-center justify-between gap-4"
          aria-label={t("navigation")}>
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/">
              <HugeiconsIcon
                data-icon="inline-start"
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("backToDashboard")}
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/students/add">
              <HugeiconsIcon
                data-icon="inline-start"
                icon={Add01Icon}
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("addStudent")}
            </Link>
          </Button>
        </nav>

        <header className="pb-10 pt-14 sm:pt-20 lg:pb-14 lg:pt-24">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="max-w-5xl text-balance text-[clamp(3rem,7vw,7rem)] font-black leading-[0.84] tracking-[-0.085em]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-sm font-semibold text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </header>

        <section aria-label={t("directory")}>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Label htmlFor="student-search" className="sr-only">
                {t("searchLabel")}
              </Label>
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 start-3 size-5 text-muted-foreground"
              />
              <Input
                id="student-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-12 rounded-xl ps-10"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex min-h-12 items-center gap-3 px-3">
                <Switch
                  id="hide-inactive-students"
                  checked={hideInactive}
                  onCheckedChange={setHideInactive}
                />
                <Label
                  htmlFor="hide-inactive-students"
                  className="cursor-pointer whitespace-nowrap">
                  {t("hideInactive")}
                </Label>
              </div>
              <div>
                <Label htmlFor="student-sort" className="mb-2">
                  {t("sortLabel")}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      id="student-sort"
                      className="group h-12 min-w-44 justify-between rounded-xl px-3 font-normal">
                      {t(`sort.${sort}`)}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-2">
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(value) => setSort(value as StudentSort)}>
                      <DropdownMenuRadioItem value="name">
                        {t("sort.name")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rate">
                        {t("sort.rate")}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="level">
                        {t("sort.level")}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="mb-4 flex min-h-12 flex-wrap items-center justify-between gap-3">
            <p
              aria-live="polite"
              className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("results", { count: directory.totalStudents })}
            </p>
            {filtersHideResults ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("filtersMayHideResults")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 rounded-full"
                  onClick={resetFilters}>
                  {t("resetFilters")}
                </Button>
              </div>
            ) : null}
          </div>

          {mutationErrorKey ? (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {t(mutationErrorKey)}
            </p>
          ) : null}

          {studentsQuery.isPending ? (
            <div className="rounded-3xl border border-dashed p-12 text-center">
              <p className="text-xl font-black">{t("loading")}</p>
            </div>
          ) : students.length ? (
            <div
              ref={viewportRef}
              role="list"
              aria-label={t("directory")}
              className="h-[70dvh] min-h-112 max-h-180 overflow-auto rounded-3xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              style={gridStyles}
              tabIndex={0}>
              <div
                className="relative w-full"
                style={{ height: rowVirtualizer.getTotalSize() }}>
                {virtualRows.map((virtualRow) => {
                  const rowStudents = students.slice(
                    virtualRow.index * columns,
                    virtualRow.index * columns + columns,
                  );

                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute start-0 top-0 grid w-full justify-center gap-(--student-grid-gap)"
                      style={{
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                        gridTemplateColumns:
                          `repeat(${columns}, minmax(0, var(--student-card-width)))`,
                      }}>
                      {rowStudents.map((student) => (
                        <div key={student.id} role="listitem">
                          <StudentCard
                            student={student}
                            href={`/students/${student.id}`}
                            formatMoney={formatMoney}
                            pending={
                              statusMutation.isPending ||
                              deleteMutation.isPending
                            }
                            onStatusChange={() =>
                              statusMutation.mutate(student)
                            }
                            onDelete={() => setStudentToDelete(student)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {studentsQuery.isFetchingNextPage ? (
                <p className="py-4 text-center text-sm font-bold" role="status">
                  {t("loadingMore")}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed p-12 text-center">
              <p className="text-xl font-black">
                {filtersHideResults ? t("noMatches") : t("empty")}
              </p>
            </div>
          )}

          {studentsQuery.isError ? (
            <p role="alert" className="mt-4 text-sm font-bold text-destructive">
              {t("errors.general")}
            </p>
          ) : null}
        </section>
        <DeleteStudentConfirmation
          name={studentToDelete?.name ?? ""}
          open={studentToDelete !== null}
          pending={deleteMutation.isPending}
          onOpenChange={(open) => {
            if (!open && !deleteMutation.isPending) setStudentToDelete(null);
          }}
          onConfirm={() => {
            if (studentToDelete) deleteMutation.mutate(studentToDelete);
          }}
        />
      </div>
    </main>
  );
}
