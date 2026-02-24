/**
 * Mapbox Directions API integration for walking routes
 * Free tier: 100,000 requests/month
 */

export interface DirectionsResult {
  coordinates: [number, number][];
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Get walking directions between two points using Mapbox Directions API
 */
export async function getWalkingDirections(
  start: [number, number],
  end: [number, number]
): Promise<DirectionsResult | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!accessToken) {
    console.warn("Mapbox token not found, falling back to straight line");
    return null;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Mapbox Directions API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn("No routes found from Mapbox");
      return null;
    }

    const route = data.routes[0];

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
}

/**
 * Get walking directions for multiple waypoints
 */
export async function getMultiStopWalkingRoute(
  waypoints: [number, number][]
): Promise<DirectionsResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!accessToken) {
    console.warn("Mapbox token not found");
    return null;
  }

  try {
    // Build coordinates string: lng1,lat1;lng2,lat2;...
    const coordsString = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(";");

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsString}?geometries=geojson&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Mapbox Directions API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn("No routes found from Mapbox");
      return null;
    }

    const route = data.routes[0];

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error("Error fetching multi-stop directions:", error);
    return null;
  }
}
