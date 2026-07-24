"use client";

import { create } from "zustand";

export type StudentSort = "name" | "rate" | "level";

type StudentDirectoryState = {
  search: string;
  sort: StudentSort;
  setSearch: (search: string) => void;
  setSort: (sort: StudentSort) => void;
};

export const useStudentDirectoryStore = create<StudentDirectoryState>((set) => ({
  search: "",
  sort: "name",
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
}));
