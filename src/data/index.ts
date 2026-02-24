import { createClient } from "@/utils/supabase/server";

export async function getBuildingPolygons() {
  const supabase = await createClient();

  // const { data: building, error } = await supabase.from("building").select("*");
  const { data, error } = await supabase.from("building_polygons").select(`
      id,
      geojson,
      building_id 
    `);
  if (error) throw error;

  return data;
}

export async function getBuildings() {
  const supabase = await createClient();

  const { data: building, error } = await supabase.from("building").select("*");
  if (error) throw error;

  return building;
}

export async function getEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("event").select("*");
  if (error) throw error;

  return data;
}

export async function getParkingLots() {
  const supabase = await createClient();

  // Query buildings where name contains "Parking"
  const { data, error } = await supabase
    .from("building")
    .select("*")
    .ilike("name", "%parking%");

  if (error) {
    console.warn("Error fetching parking lots:", error);
    return [];
  }

  return data || [];
}

export async function getParkingPolygons() {
  const supabase = await createClient();

  // Get building polygons for parking lots
  const parkingLots = await getParkingLots();
  const parkingIds = parkingLots.map((lot) => lot.id);

  if (parkingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("building_polygons")
    .select("*")
    .in("building_id", parkingIds);

  if (error) {
    console.warn("Error fetching parking polygons:", error);
    return [];
  }

  return data || [];
}

export async function getUserAdminStatus() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const userId = user.id;
  const { data, error } = await supabase
    .from("campusAdmin")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (data?.user_id) return true;

  return false;
}

export async function approveEvent(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const userId = user.id;

  const adminRes = await supabase
    .from("campusAdmin")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminRes.error) throw adminRes.error;

  if (!adminRes.data?.user_id) {
   throw new Error("User is not an admin");
  }

  const { data, error } = await supabase
    .from("event")
    .update({ isApproved: true })
    .eq("id", eventId);
  if (error) throw error;

  return data;
}



export async function deleteEvent(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const userId = user.id;

  const adminRes = await supabase
    .from("campusAdmin")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminRes.error) throw adminRes.error;

  if (!adminRes.data?.user_id) {
   throw new Error("User is not an admin");
  }

  const { data, error } = await supabase
    .from("event")
    .delete()
    .eq("id", eventId);
    if(error)console.log("error", error);
  if (error) throw error;

  return data;
}

// Construction Zones
export {
  getActiveConstructionZones,
  getAllConstructionZones,
  getConstructionZone,
} from "./constructionZones";

// Saved Routes
export { getSavedRoutes } from "./savedRoutes";