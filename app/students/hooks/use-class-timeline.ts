"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { listClassesPageAction } from "@/app/students/classes/query-actions";
import type {
  ClassCursor,
  StudentClassTimeline,
} from "@/lib/classes/contracts";

type PageParam = { direction: "earlier" | "later"; cursor: ClassCursor } | null;

export function useClassTimeline(
  studentId: string | undefined,
  initialData: StudentClassTimeline,
  version: string,
) {
  const initialPage = {
    classes: [...initialData.past, ...initialData.future],
    earlier: initialData.earlierCursor,
    later: initialData.laterCursor,
  };
  const query = useInfiniteQuery({
    queryKey: ["student-class-pages", studentId, version],
    initialPageParam: null as PageParam,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async ({ pageParam }) => {
      if (!pageParam) return initialPage;
      const result = await listClassesPageAction({
        studentId,
        ...pageParam,
      });
      if (!result.ok) throw new Error(result.error);
      return {
        classes: result.data.classes,
        earlier:
          pageParam.direction === "earlier" ? result.data.nextCursor : null,
        later: pageParam.direction === "later" ? result.data.nextCursor : null,
      };
    },
    getPreviousPageParam: (page): PageParam | undefined =>
      page.earlier ? { direction: "earlier", cursor: page.earlier } : undefined,
    getNextPageParam: (page): PageParam | undefined =>
      page.later ? { direction: "later", cursor: page.later } : undefined,
    retry: false,
  });
  const classes = [
    ...new Map(
      query.data.pages
        .flatMap((page) => page.classes)
        .map((item) => [item.id, item]),
    ).values(),
  ];
  return { ...query, classes };
}
