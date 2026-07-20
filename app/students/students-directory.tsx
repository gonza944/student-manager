"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import type { StudentDirectory as StudentDirectoryData } from "@/lib/students/contracts";

import { StudentDirectory } from "./components/student-directory";

export function StudentsDirectory({
  initialData,
}: {
  initialData: StudentDirectoryData;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StudentDirectory initialData={initialData} />
    </QueryClientProvider>
  );
}
