import {
  CampusGraph,
  MatchResult,
  ScheduleRoute,
  RouteStop,
  PathResult,
} from "@/types/schedule";
import { Tables } from "@/types/supabase";
import { ConstructionZone } from "@/types/constructionZone";
import { findShortestPath } from "./dijkstra";
import { compareTime } from "../schedule/scheduleParser";
import { getCenterFromPolygon } from "./geoUtils";
import { getFilteredGraph } from "./edgeFiltering";

type BuildingPolygon = Tables<"building_polygons">;

/**
 * Plan a route through all matched classes sorted by time
 * @param graph Campus graph for pathfinding
 * @param matchedClasses Array of match results with parsed classes
 * @param buildingPolygons Building polygon data for coordinates
 * @param constructionZones Construction zones to avoid (optional)
 * @returns ScheduleRoute with all stops and path segments
 */
export function planScheduleRoute(
  graph: CampusGraph,
  matchedClasses: MatchResult[],
  buildingPolygons: BuildingPolygon[],
  constructionZones: ConstructionZone[] = []
): ScheduleRoute {
  // Filter graph to avoid construction zones
  const filteredGraph =
    constructionZones.length > 0 ? getFilteredGraph(graph, constructionZones) : graph;
  // Filter to only classes with matched buildings and sort by start time
  const validClasses = matchedClasses
    .filter((mc) => mc.match !== null)
    .sort((a, b) =>
      compareTime(a.parsedClass.startTime, b.parsedClass.startTime)
    );

  if (validClasses.length === 0) {
    return {
      stops: [],
      totalDistance: 0,
      totalWalkTime: 0,
      segments: [],
    };
  }

  const stops: RouteStop[] = [];
  const segments: PathResult[] = [];
  let totalDistance = 0;
  let totalWalkTime = 0;

  // Create stops for each class
  for (let i = 0; i < validClasses.length; i++) {
    const mc = validClasses[i];
    const building = mc.match!.building;

    // Get building coordinates from polygon
    const polygon = buildingPolygons.find((bp) => bp.building_id === building.id);
    let coordinates: [number, number] | null = null;

    if (polygon?.geojson) {
      try {
        coordinates = getCenterFromPolygon(polygon.geojson);
      } catch {
        console.warn(`Could not get coordinates for building: ${building.name}`);
      }
    }

    // Fallback: try to get coordinates from graph node
    if (!coordinates) {
      const node = filteredGraph.nodes.get(building.id);
      if (node) {
        coordinates = node.coordinates;
      }
    }

    // Skip buildings with no valid coordinates
    if (!coordinates) {
      console.warn(`Skipping building with no coordinates: ${building.name}`);
      continue;
    }

    stops.push({
      order: i + 1,
      building,
      coordinates,
      classTime: mc.parsedClass.startTime,
      className:
        mc.parsedClass.courseName ||
        mc.parsedClass.courseCode ||
        `Class ${i + 1}`,
      room: mc.parsedClass.roomRaw,
    });

    // Calculate path to next class
    if (i < validClasses.length - 1) {
      const nextMc = validClasses[i + 1];
      const nextBuilding = nextMc.match!.building;

      const path = findShortestPath(filteredGraph, building.id, nextBuilding.id);

      if (path) {
        segments.push(path);
        totalDistance += path.totalDistance;
        totalWalkTime += path.totalWalkTime;
      }
    }
  }

  return {
    stops,
    totalDistance,
    totalWalkTime,
    segments,
  };
}

/**
 * Build GeoJSON FeatureCollection for route visualization
 * @param route The schedule route
 * @returns GeoJSON FeatureCollection
 */
export function buildRouteGeoJSON(
  route: ScheduleRoute
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  // Add line for each segment
  for (let i = 0; i < route.segments.length; i++) {
    const segment = route.segments[i];

    features.push({
      type: "Feature",
      properties: {
        segmentIndex: i,
        distance: segment.totalDistance,
        walkTime: segment.totalWalkTime,
      },
      geometry: {
        type: "LineString",
        coordinates: segment.coordinates,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Get route summary text
 */
export function getRouteSummary(route: ScheduleRoute): string {
  const { stops, totalDistance, totalWalkTime } = route;

  if (stops.length === 0) {
    return "No route available";
  }

  if (stops.length === 1) {
    return `1 class at ${stops[0].building.name}`;
  }

  const distanceText =
    totalDistance < 1000
      ? `${Math.round(totalDistance)} m`
      : `${(totalDistance / 1000).toFixed(1)} km`;

  const timeText =
    totalWalkTime < 1
      ? "< 1 min"
      : totalWalkTime < 60
        ? `${Math.round(totalWalkTime)} min`
        : `${Math.floor(totalWalkTime / 60)}h ${Math.round(totalWalkTime % 60)}m`;

  return `${stops.length} classes | ${distanceText} total | ~${timeText} walking`;
}
