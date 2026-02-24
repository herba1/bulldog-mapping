import { PathEdge, PathNode, CampusGraph } from "@/types/schedule";
import { ConstructionZone } from "@/types/constructionZone";
import * as turf from "@turf/turf";

/**
 * Check if an edge (straight line between two nodes) intersects any construction zones
 * @param fromNode Starting node
 * @param toNode Ending node
 * @param zones Array of construction zones to check
 * @returns true if edge intersects any active zone
 */
export function edgeIntersectsZones(
  fromNode: PathNode,
  toNode: PathNode,
  zones: ConstructionZone[]
): boolean {
  if (zones.length === 0) return false;

  // Create a line from the two coordinates
  const line = turf.lineString([fromNode.coordinates, toNode.coordinates]);

  // Check each zone for intersection
  for (const zone of zones) {
    if (!zone.isActive) continue;

    try {
      const polygon = turf.polygon(zone.geojson.geometry.coordinates);

      // Check if line intersects or is contained by polygon
      if (
        turf.booleanIntersects(line, polygon) ||
        turf.booleanContains(polygon, line)
      ) {
        return true;
      }
    } catch (error) {
      console.warn(`Error checking zone ${zone.name}:`, error);
    }
  }

  return false;
}

/**
 * Filter edges to remove those that pass through construction zones
 * @param edges Original edge map
 * @param nodes Node map for coordinate lookup
 * @param zones Construction zones to avoid
 * @returns Filtered edge map with blocked edges removed
 */
export function filterEdgesByConstructionZones(
  edges: Map<string, PathEdge[]>,
  nodes: Map<string, PathNode>,
  zones: ConstructionZone[]
): Map<string, PathEdge[]> {
  if (zones.length === 0) return edges;

  const filteredEdges = new Map<string, PathEdge[]>();

  for (const [nodeId, nodeEdges] of edges) {
    const fromNode = nodes.get(nodeId);
    if (!fromNode) continue;

    const safeEdges = nodeEdges.filter((edge) => {
      const toNode = nodes.get(edge.to);
      if (!toNode) return false;

      return !edgeIntersectsZones(fromNode, toNode, zones);
    });

    filteredEdges.set(nodeId, safeEdges);
  }

  return filteredEdges;
}

/**
 * Get filtered campus graph with construction zone avoidance
 * @param originalGraph Original campus graph
 * @param zones Construction zones to avoid
 * @returns New graph with filtered edges
 */
export function getFilteredGraph(
  originalGraph: CampusGraph,
  zones: ConstructionZone[]
): CampusGraph {
  return {
    nodes: originalGraph.nodes,
    edges: filterEdgesByConstructionZones(
      originalGraph.edges,
      originalGraph.nodes,
      zones
    ),
    constructionZones: zones,
  };
}
