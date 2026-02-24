import { Tables } from "./supabase";
import { ConstructionZone } from "./constructionZone";

// OCR Types
export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
}

export interface OCRError {
  type: "LOW_CONFIDENCE" | "NO_TEXT" | "INVALID_FORMAT" | "FILE_TOO_LARGE";
  message: string;
  confidence?: number;
}

// Parsed Schedule Types
export interface ParsedClass {
  id: string;
  courseName?: string;
  courseCode?: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  buildingRaw: string;
  roomRaw: string;
  rawText: string;
}

export interface ParsedSchedule {
  classes: ParsedClass[];
  parseErrors: string[];
  rawText: string;
}

// Building Matching Types
export type BuildingData = Tables<"building">;

export interface BuildingMatch {
  building: BuildingData;
  confidence: number;
  matchType: "exact" | "partial" | "fuzzy";
  matchedOn: string;
}

export interface MatchResult {
  parsedClass: ParsedClass;
  match: BuildingMatch | null;
  suggestions: BuildingMatch[];
}

// Pathfinding Types
export interface PathNode {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  type: "building" | "intersection" | "entrance";
  buildingId?: string;
}

export interface PathEdge {
  from: string;
  to: string;
  distance: number; // meters
  walkTime: number; // minutes
}

export interface CampusGraph {
  nodes: Map<string, PathNode>;
  edges: Map<string, PathEdge[]>;
  constructionZones?: ConstructionZone[];
}

export interface PathSegment {
  from: PathNode;
  to: PathNode;
  distance: number;
  walkTime: number;
}

export interface PathResult {
  path: string[];
  coordinates: [number, number][];
  totalDistance: number;
  totalWalkTime: number;
  segments: PathSegment[];
}

// Route Planning Types
export interface RouteStop {
  order: number;
  building: BuildingData;
  coordinates: [number, number];
  classTime: string;
  className?: string;
  room?: string;
}

export interface ScheduleRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalWalkTime: number;
  segments: PathResult[];
}

// State Types
export interface ScheduleRouteState {
  route: ScheduleRoute | null;
  isVisible: boolean;
  highlightedStop: number | null;
  matchResults: MatchResult[] | null;
}
