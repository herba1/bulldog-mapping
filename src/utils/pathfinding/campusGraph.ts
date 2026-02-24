import { CampusGraph, PathNode, PathEdge, BuildingData } from "@/types/schedule";
import { Tables } from "@/types/supabase";
import { haversineDistance, calculateWalkTime, getCenterFromPolygon } from "./geoUtils";

type BuildingPolygon = Tables<"building_polygons">;

/**
 * Build a complete graph connecting all buildings directly
 * This is the MVP approach - connects every building to every other building
 * Future enhancement: Add actual walkway nodes for more realistic paths
 */
export function buildCampusGraph(
  buildings: BuildingData[],
  buildingPolygons: BuildingPolygon[]
): CampusGraph {
  const nodes = new Map<string, PathNode>();
  const edges = new Map<string, PathEdge[]>();

  // Create a node for each building using its polygon center
  for (const building of buildings) {
    const polygon = buildingPolygons.find(
      (bp) => bp.building_id === building.id
    );

    if (!polygon?.geojson) {
      continue;
    }

    try {
      const center = getCenterFromPolygon(polygon.geojson);

      nodes.set(building.id, {
        id: building.id,
        coordinates: center,
        type: "building",
        buildingId: building.id,
      });
    } catch {
      // Skip buildings with invalid polygons
      console.warn(`Could not get center for building: ${building.name}`);
    }
  }

  // Create edges between all buildings (complete graph)
  const nodeIds = Array.from(nodes.keys());

  for (const fromId of nodeIds) {
    const fromNode = nodes.get(fromId)!;
    const edgeList: PathEdge[] = [];

    for (const toId of nodeIds) {
      if (fromId === toId) continue;

      const toNode = nodes.get(toId)!;
      const distance = haversineDistance(
        fromNode.coordinates,
        toNode.coordinates
      );
      const walkTime = calculateWalkTime(distance);

      edgeList.push({
        from: fromId,
        to: toId,
        distance,
        walkTime,
      });
    }

    edges.set(fromId, edgeList);
  }

  return { nodes, edges };
}

/**
 * Get the node for a specific building
 */
export function getBuildingNode(
  graph: CampusGraph,
  buildingId: string
): PathNode | null {
  return graph.nodes.get(buildingId) || null;
}

/**
 * Get all edges from a specific node
 */
export function getNodeEdges(
  graph: CampusGraph,
  nodeId: string
): PathEdge[] {
  return graph.edges.get(nodeId) || [];
}

/**
 * Check if a building exists in the graph
 */
export function hasBuilding(graph: CampusGraph, buildingId: string): boolean {
  return graph.nodes.has(buildingId);
}
