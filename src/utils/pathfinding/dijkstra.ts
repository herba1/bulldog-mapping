import { CampusGraph, PathResult, PathSegment } from "@/types/schedule";

/**
 * Find the shortest path between two nodes using Dijkstra's algorithm
 * @param graph The campus graph
 * @param startId Starting node ID
 * @param endId Ending node ID
 * @returns PathResult with path details, or null if no path exists
 */
export function findShortestPath(
  graph: CampusGraph,
  startId: string,
  endId: string
): PathResult | null {
  // Check if both nodes exist
  if (!graph.nodes.has(startId) || !graph.nodes.has(endId)) {
    return null;
  }

  // Same building - no path needed
  if (startId === endId) {
    const node = graph.nodes.get(startId)!;
    return {
      path: [startId],
      coordinates: [node.coordinates],
      totalDistance: 0,
      totalWalkTime: 0,
      segments: [],
    };
  }

  // Initialize data structures
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  // Initialize all distances to infinity except start
  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, nodeId === startId ? 0 : Infinity);
    previous.set(nodeId, null);
  }

  // Priority queue (using array + sorting for simplicity)
  const queue: string[] = [startId];

  while (queue.length > 0) {
    // Get node with minimum distance
    queue.sort((a, b) => distances.get(a)! - distances.get(b)!);
    const current = queue.shift()!;

    // Skip if already visited
    if (visited.has(current)) continue;
    visited.add(current);

    // Found the destination
    if (current === endId) break;

    // Process neighbors
    const edges = graph.edges.get(current) || [];
    for (const edge of edges) {
      if (visited.has(edge.to)) continue;

      const newDist = distances.get(current)! + edge.distance;
      if (newDist < distances.get(edge.to)!) {
        distances.set(edge.to, newDist);
        previous.set(edge.to, current);

        if (!queue.includes(edge.to)) {
          queue.push(edge.to);
        }
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endId;

  while (current) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  // Check if path is valid (starts at startId)
  if (path[0] !== startId) {
    return null;
  }

  // Build result with coordinates and segments
  return buildPathResult(graph, path);
}

/**
 * Build the PathResult from a list of node IDs
 */
function buildPathResult(graph: CampusGraph, path: string[]): PathResult {
  const coordinates: [number, number][] = [];
  const segments: PathSegment[] = [];
  let totalDistance = 0;
  let totalWalkTime = 0;

  for (let i = 0; i < path.length; i++) {
    const node = graph.nodes.get(path[i])!;
    coordinates.push(node.coordinates);

    // Create segment for each pair of consecutive nodes
    if (i < path.length - 1) {
      const fromNode = node;
      const toNode = graph.nodes.get(path[i + 1])!;

      // Find the edge
      const edges = graph.edges.get(path[i]) || [];
      const edge = edges.find((e) => e.to === path[i + 1]);

      if (edge) {
        segments.push({
          from: fromNode,
          to: toNode,
          distance: edge.distance,
          walkTime: edge.walkTime,
        });
        totalDistance += edge.distance;
        totalWalkTime += edge.walkTime;
      }
    }
  }

  return {
    path,
    coordinates,
    totalDistance,
    totalWalkTime,
    segments,
  };
}

/**
 * Find the shortest path visiting multiple stops in order
 * @param graph The campus graph
 * @param stops Array of node IDs to visit in order
 * @returns Array of PathResults for each segment
 */
export function findMultiStopPath(
  graph: CampusGraph,
  stops: string[]
): PathResult[] {
  const results: PathResult[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const path = findShortestPath(graph, stops[i], stops[i + 1]);
    if (path) {
      results.push(path);
    }
  }

  return results;
}
