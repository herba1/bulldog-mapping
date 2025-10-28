"use client";
import { create } from "zustand";

interface EventData {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  description?: string;
}

interface SelectedEventState {
  selectedEvent: EventData | null;
  setSelectedEvent: (event: EventData | null) => void;
}

// ✅ Properly typed Zustand store
export const useSelectionStore = create<SelectedEventState>()((set) => ({
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));
