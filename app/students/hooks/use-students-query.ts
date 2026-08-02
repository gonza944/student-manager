"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type {
  StudentCursor,
  StudentListPage,
} from "@/lib/students/contracts";

import { listStudentsAction } from "../actions";
import type { StudentSort } from "../store/student-store";

const pageSize = 20;

export function useStudentsQuery({
  initialData,
  search,
  sort,
  hideInactive,
}: {
  initialData: StudentListPage;
  search: string;
  sort: StudentSort;
  hideInactive: boolean;
}) {
  const normalizedSearch = search.trim();
  const isDefaultQuery =
    normalizedSearch === "" && sort === "name" && !hideInactive;

  return useInfiniteQuery({
    queryKey: [
      "students",
      { search: normalizedSearch, sort, hideInactive },
    ],
    queryFn: async ({ pageParam }) => {
      const result = await listStudentsAction({
        search: normalizedSearch,
        sort,
        hideInactive,
        limit: pageSize,
        cursor: pageParam,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    initialPageParam: null as StudentCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: isDefaultQuery
      ? { pages: [initialData], pageParams: [null] }
      : undefined,
    staleTime: 60_000,
  });
}
