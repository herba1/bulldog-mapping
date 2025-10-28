import { create } from "zustand";

export const useSelectionStore = create((set) => ({
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));
