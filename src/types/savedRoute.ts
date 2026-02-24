export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export const DAY_LABELS: Record<DayOfWeek, { short: string; full: string }> = {
  monday: { short: "M", full: "Monday" },
  tuesday: { short: "T", full: "Tuesday" },
  wednesday: { short: "W", full: "Wednesday" },
  thursday: { short: "Th", full: "Thursday" },
  friday: { short: "F", full: "Friday" },
};

/**
 * A user's saved route for a specific day of the week
 */
export interface SavedRoute {
  id: string;
  userId: string;
  name: string;
  dayOfWeek: DayOfWeek;
  buildingNames: string[];
  parkingLotName: string | null;
  createdAt: string;
  updatedAt: string;
}
