"use client";
import React, { createContext, useContext, useState } from "react";
import { Tables } from "@/types/supabase";
import { ScheduleRoute, MatchResult } from "@/types/schedule";
import { ConstructionZone } from "@/types/constructionZone";
import { Feature, Polygon } from "geojson";

const MapContext = createContext<MapContextType | null>(null);

type Building = Tables<"building">;
type Event = Tables<"event">;
type BuildingPolygon = Tables<"building_polygons">;

type FilterState = {
  tags: string[];
  dateRange?: {
    start: string;
    end: string;
  };
};

type MapPointerEvents = "all" | "dropPin" | "none";

type ScheduleRouteState = {
  route: ScheduleRoute | null;
  isVisible: boolean;
  highlightedStop: number | null;
  matchResults: MatchResult[] | null;
};

type DrawingModeState = {
  isActive: boolean;
  drawnPolygon: Feature<Polygon> | null;
};

type MapContextType = {
  buildings: Building[];
  events: Event[];
  buildingPolygons: BuildingPolygon[];
  parkingLots: Building[];
  parkingPolygons: BuildingPolygon[];
  constructionZones: ConstructionZone[];
  selectedBuilding: Building | null;
  selectedEvent: Event | null;
  selectedConstructionZone: ConstructionZone | null;
  searchQuery: string;
  lastClickedCords?: [number, number] | null;
  mapPointerEvents: MapPointerEvents;
  filters: FilterState;
  flyToTarget: { lng: number; lat: number; zoom?: number } | null;
  scheduleRoute: ScheduleRouteState;
  drawingMode: DrawingModeState;
  setLastClickedCords: (cords: [number, number] | null) => void;
  setMapPointerEvents: (mode: MapPointerEvents) => void;
  setSelectedBuilding: (building: Building | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedConstructionZone: (zone: ConstructionZone | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: FilterState) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  setScheduleRoute: (route: ScheduleRoute | null, matchResults?: MatchResult[] | null) => void;
  clearScheduleRoute: () => void;
  highlightRouteStop: (stopIndex: number | null) => void;
  toggleRouteVisibility: () => void;
  startDrawing: () => void;
  stopDrawing: () => void;
  setDrawnPolygon: (polygon: Feature<Polygon> | null) => void;
};

type MapProviderProps = {
  children: React.ReactNode;
  buildings: Building[];
  events: Event[];
  buildingPolygons: BuildingPolygon[];
  parkingLots: Building[];
  parkingPolygons: BuildingPolygon[];
  constructionZones: ConstructionZone[];
};

export function MapProvider({
  children,
  buildings,
  events,
  buildingPolygons,
  parkingLots,
  parkingPolygons,
  constructionZones,
}: MapProviderProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedConstructionZone, setSelectedConstructionZone] =
    useState<ConstructionZone | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapPointerEvents, setMapPointerEvents] =
    useState<MapPointerEvents>("all");
  const [lastClickedCords, setLastClickedCords] = useState<
    [number, number] | null
  >(null);
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    dateRange: undefined,
  });
  const [flyToTarget, setFlyToTarget] = useState<{
    lng: number;
    lat: number;
    zoom?: number;
  } | null>(null);
  const [scheduleRoute, setScheduleRouteState] = useState<ScheduleRouteState>({
    route: null,
    isVisible: false,
    highlightedStop: null,
    matchResults: null,
  });
  const [drawingMode, setDrawingModeState] = useState<DrawingModeState>({
    isActive: false,
    drawnPolygon: null,
  });

  const flyTo = (lng: number, lat: number, zoom?: number) => {
    setFlyToTarget({ lng, lat, zoom });
  };

  const setScheduleRoute = (route: ScheduleRoute | null, matchResults?: MatchResult[] | null) => {
    setScheduleRouteState({
      route,
      isVisible: route !== null,
      highlightedStop: null,
      matchResults: matchResults ?? null,
    });
  };

  const clearScheduleRoute = () => {
    setScheduleRouteState({
      route: null,
      isVisible: false,
      highlightedStop: null,
      matchResults: null,
    });
  };

  const highlightRouteStop = (stopIndex: number | null) => {
    setScheduleRouteState((prev) => ({
      ...prev,
      highlightedStop: stopIndex,
    }));
  };

  const toggleRouteVisibility = () => {
    setScheduleRouteState((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
    }));
  };

  const startDrawing = () => {
    setDrawingModeState({
      isActive: true,
      drawnPolygon: null,
    });
  };

  const stopDrawing = () => {
    setDrawingModeState((prev) => ({
      ...prev,
      isActive: false,
    }));
  };

  const setDrawnPolygon = (polygon: Feature<Polygon> | null) => {
    setDrawingModeState((prev) => ({
      ...prev,
      drawnPolygon: polygon,
    }));
  };

  const value: MapContextType = {
    buildings,
    events,
    buildingPolygons,
    parkingLots,
    parkingPolygons,
    constructionZones,
    selectedBuilding,
    selectedEvent,
    selectedConstructionZone,
    searchQuery,
    filters,
    mapPointerEvents,
    lastClickedCords,
    flyToTarget,
    scheduleRoute,
    drawingMode,
    setLastClickedCords,
    setMapPointerEvents,
    setSelectedBuilding,
    setSelectedEvent,
    setSelectedConstructionZone,
    setSearchQuery,
    setFilters,
    flyTo,
    setScheduleRoute,
    clearScheduleRoute,
    highlightRouteStop,
    toggleRouteVisibility,
    startDrawing,
    stopDrawing,
    setDrawnPolygon,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}

// Export types for use in other components
export type { Building, Event, BuildingPolygon, FilterState };
