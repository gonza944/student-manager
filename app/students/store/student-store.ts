"use client";

import { create } from "zustand";

export type StudentSort = "name" | "rate" | "level";

type StudentDirectoryState = {
  search: string;
  sort: StudentSort;
  hideInactive: boolean;
  setSearch: (search: string) => void;
  setSort: (sort: StudentSort) => void;
  setHideInactive: (hideInactive: boolean) => void;
  resetFilters: () => void;
};

export const useStudentDirectoryStore = create<StudentDirectoryState>((set) => ({
  search: "",
  sort: "name",
  hideInactive: false,
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  setHideInactive: (hideInactive) => set({ hideInactive }),
  resetFilters: () => set({ search: "", hideInactive: false }),
}));
