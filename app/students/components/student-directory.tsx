"use client";

import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

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
  StudentDirectory as StudentDirectoryData,
  StudentDto,
} from "@/lib/students/contracts";

import {
  deleteStudentAction,
  listStudentsAction,
  setStudentActiveAction,
} from "../actions";
import { StudentCard } from "./student-card";
import {
  useStudentDirectoryStore,
  type StudentSort,
} from "../student-store";

const actionErrorKeys: Record<
  string,
  "errors.validation" | "errors.permission" | "errors.notFound"
> = {
  validation: "errors.validation",
  unauthenticated: "errors.permission",
  forbidden: "errors.permission",
  notFound: "errors.notFound",
};

export function StudentDirectory({
  initialData,
}: {
  initialData: StudentDirectoryData;
}) {
  const t = useTranslations("Students");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const search = useStudentDirectoryStore((state) => state.search);
  const sort = useStudentDirectoryStore((state) => state.sort);
  const setSearch = useStudentDirectoryStore((state) => state.setSearch);
  const setSort = useStudentDirectoryStore((state) => state.setSort);

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const result = await listStudentsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    initialData,
    staleTime: 60_000,
  });
  const directory = studentsQuery.data;
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
  const regionNames = useMemo(
    () => new Intl.DisplayNames(locale, { type: "region" }),
    [locale],
  );
  const statusMutation = useMutation({
    mutationFn: async (student: StudentDto) => {
      const result = await setStudentActiveAction({
        studentId: student.id,
        isActive: !student.isActive,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (student: StudentDto) => {
      const result = await deleteStudentAction({ studentId: student.id });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    const filtered = term
      ? directory.students.filter((student) =>
          [
            student.name,
            student.email,
            regionNames.of(student.nationalityCode) ?? student.nationalityCode,
          ].some((value) => value.toLocaleLowerCase(locale).includes(term)),
        )
      : directory.students;

    return filtered.toSorted((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (sort === "rate") return b.rates.grossMinor - a.rates.grossMinor;
      const valueA = sort === "level" ? a.level : a.name;
      const valueB = sort === "level" ? b.level : b.name;
      return valueA.localeCompare(valueB, locale);
    });
  }, [directory.students, locale, regionNames, search, sort]);

  const mutationError = statusMutation.error ?? deleteMutation.error;
  const mutationErrorKey = mutationError
    ? (actionErrorKeys[mutationError.message] ?? "errors.general")
    : null;

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[90rem]">
        <nav
          className="flex items-center gap-4"
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative w-full max-w-xl">
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
            <div className="w-full sm:max-w-80 flex gap-2 shrink-0">
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

          <p
            aria-live="polite"
            className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t("results", { count: visibleStudents.length })}
          </p>
          {mutationErrorKey ? (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {t(mutationErrorKey)}
            </p>
          ) : null}

          {visibleStudents.length ? (
            <ul
              role="list"
              className="grid list-none grid-cols-1 justify-center gap-4 sm:grid-cols-[repeat(auto-fill,18rem)]">
              {visibleStudents.map((student) => (
                <li key={student.id}>
                  <StudentCard
                    student={student}
                    formatMoney={formatMoney}
                    pending={
                      statusMutation.isPending || deleteMutation.isPending
                    }
                    onStatusChange={() => statusMutation.mutate(student)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          t("confirmDelete", { name: student.name }),
                        )
                      )
                        deleteMutation.mutate(student);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed p-12 text-center">
              <p className="text-xl font-black">
                {search ? t("noMatches") : t("empty")}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
