import { Feature, Polygon } from "geojson";

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 [longitude, latitude]
 * @param coord2 [longitude, latitude]
 * @returns Distance in meters
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate the center point of a GeoJSON polygon
 * @param geojson GeoJSON Feature with Polygon geometry
 * @returns [longitude, latitude]
 */
export function getCenterFromPolygon(
  geojson: Feature<Polygon> | unknown
): [number, number] {
  const feature = geojson as Feature<Polygon>;

  if (!feature?.geometry?.coordinates?.[0]) {
    throw new Error("Invalid GeoJSON polygon");
  }

  const coords = feature.geometry.coordinates[0] as [number, number][];

  // Calculate centroid
  let sumLng = 0;
  let sumLat = 0;

  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }

  return [sumLng / coords.length, sumLat / coords.length];
}

/**
 * Calculate walking time based on distance
 * Assumes average walking speed of 5 km/h (83.33 m/min)
 * @param distanceMeters Distance in meters
 * @returns Time in minutes
 */
export function calculateWalkTime(distanceMeters: number): number {
  const walkingSpeedMetersPerMin = 83.33; // 5 km/h
  return distanceMeters / walkingSpeedMetersPerMin;
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format walking time for display
 * @param minutes Time in minutes
 * @returns Formatted string
 */
export function formatWalkTime(minutes: number): string {
  if (minutes < 1) {
    return "< 1 min";
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Get bounding box for a set of coordinates
 * @param coordinates Array of [lng, lat] pairs
 * @returns { sw: [lng, lat], ne: [lng, lat] }
 */
export function getBoundingBox(
  coordinates: [number, number][]
): { sw: [number, number]; ne: [number, number] } {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    sw: [minLng, minLat],
    ne: [maxLng, maxLat],
  };
}
