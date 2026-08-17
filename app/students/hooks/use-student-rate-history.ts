"use client";

import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import type {
  StudentRateHistoryCursor,
  StudentRateHistoryEntry,
  StudentRateHistoryPage,
  UpdateStudentRateInput,
} from "@/lib/students/contracts";
import { recalculateStudentRateHistoryEntries } from "@/lib/students/rate-history";

import {
  deleteStudentRateAction,
  listStudentRatesAction,
  updateStudentRateAction,
} from "../actions";

type RateHistoryData = InfiniteData<
  StudentRateHistoryPage,
  StudentRateHistoryCursor | null
>;

const rateHistoryQueryKey = (studentId: string) =>
  ["student-rate-history", studentId] as const;

async function refreshRateHistory(queryClient: QueryClient, studentId: string) {
  const queryKey = rateHistoryQueryKey(studentId);
  queryClient.setQueryData<RateHistoryData>(queryKey, (data) =>
    data
      ? {
          pages: data.pages.slice(0, 1),
          pageParams: data.pageParams.slice(0, 1),
        }
      : data,
  );
  await Promise.all([
    queryClient.invalidateQueries({ queryKey, exact: true }),
    queryClient.invalidateQueries({ queryKey: ["students"] }),
  ]);
}

export function useUpdateStudentRateMutation(
  studentId: string,
  onSuccess: () => void,
) {
  const t = useTranslations("Students");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<UpdateStudentRateInput, "studentId">,
    ) => {
      const result = await updateStudentRateAction({ studentId, ...input });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onError: () => toast.error(t("profile.rateHistory.error")),
    onSuccess: async () => {
      await refreshRateHistory(queryClient, studentId);
      onSuccess();
      toast.success(t("profile.rateHistory.success"));
    },
  });
}

export function useStudentRateHistory({
  initialData,
  onCurrentRateChange,
  studentId,
}: {
  initialData: StudentRateHistoryPage;
  onCurrentRateChange: (rate: StudentRateHistoryEntry) => void;
  studentId: string;
}) {
  const t = useTranslations("Students");
  const queryClient = useQueryClient();
  const viewportRef = useRef<HTMLDivElement>(null);
  const queryKey = rateHistoryQueryKey(studentId);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await listStudentRatesAction({
        studentId,
        limit: 20,
        cursor: pageParam,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    initialPageParam: null as StudentRateHistoryCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: { pages: [initialData], pageParams: [null] },
    staleTime: 60_000,
  });
  const entries = useMemo(
    () => query.data.pages.flatMap((page) => page.entries),
    [query.data.pages],
  );
  const currentRate = entries[0]!;

  useEffect(() => {
    onCurrentRateChange(currentRate);
  }, [currentRate, onCurrentRateChange]);

  // TanStack Virtual deliberately exposes mutable measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 56,
    overscan: 5,
    getItemKey: (index) => entries[index]?.id ?? `rate-row-${index}`,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const lastVirtualRow = virtualRows.at(-1);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  useEffect(() => {
    if (
      lastVirtualRow &&
      lastVirtualRow.index >= entries.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    entries.length,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastVirtualRow,
  ]);

  const deleteMutation = useMutation({
    mutationFn: async (rateId: string) => {
      const result = await deleteStudentRateAction({ studentId, rateId });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (rateId) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<RateHistoryData>(queryKey);
      queryClient.setQueryData<RateHistoryData>(queryKey, (data) => {
        if (!data) return data;

        const pageLengths = data.pages.map(
          (page) =>
            page.entries.filter((entry) => entry.id !== rateId).length,
        );
        const optimisticEntries = recalculateStudentRateHistoryEntries(
          data.pages
            .flatMap((page) => page.entries)
            .filter((entry) => entry.id !== rateId),
        );
        let offset = 0;

        return {
          ...data,
          pages: data.pages.map((page, index) => {
            const pageEntries = optimisticEntries.slice(
              offset,
              offset + pageLengths[index],
            );
            offset += pageLengths[index];
            return { ...page, entries: pageEntries };
          }),
        };
      });
      return { previous };
    },
    onError: (error, _rateId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(
        t(
          error.message === "protectedRate"
            ? "profile.rateHistory.protectedRate"
            : "profile.rateHistory.deleteError",
        ),
      );
    },
    onSuccess: () => toast.success(t("profile.rateHistory.deleteSuccess")),
    onSettled: () => refreshRateHistory(queryClient, studentId),
  });

  return {
    currentRate,
    deleteMutation,
    entries,
    hasNextPage,
    isError: query.isError,
    isFetchingNextPage,
    rowVirtualizer,
    viewportRef,
    virtualRows,
  };
}
