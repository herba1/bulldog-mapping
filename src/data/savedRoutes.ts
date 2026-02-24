import { createClient } from "@/utils/supabase/server";
import { SavedRoute, DayOfWeek } from "@/types/savedRoute";

/**
 * Get all saved routes for the current user (one per day of week).
 */
export async function getSavedRoutes(): Promise<SavedRoute[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_routes")
    .select("*")
    .eq("user_id", user.id)
    .order("day_of_week");

  if (error) {
    console.warn("Error fetching saved routes:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dayOfWeek: row.day_of_week as DayOfWeek,
    buildingNames: row.building_names,
    parkingLotName: row.parking_lot_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
