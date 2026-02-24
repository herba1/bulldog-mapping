import { Feature, Polygon } from "geojson";

/**
 * Construction zone on campus that blocks pathfinding
 */
export interface ConstructionZone {
  id: string;
  name: string;
  description: string | null;
  geojson: Feature<Polygon>;
  isActive: boolean;
  isApproved: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating or updating a construction zone
 */
export interface ConstructionZoneFormData {
  name: string;
  description?: string;
  geojson: Feature<Polygon>;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}
