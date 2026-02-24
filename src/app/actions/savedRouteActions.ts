"use server";

import { createClient } from "@/utils/supabase/server";
import { DayOfWeek } from "@/types/savedRoute";
import { revalidatePath } from "next/cache";

/**
 * Save or update a route for a specific day of the week (upsert).
 */
export async function saveRoute(
  buildingNames: string[],
  parkingLotName: string | null,
  dayOfWeek: DayOfWeek,
  name?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("saved_routes")
    .upsert(
      {
        user_id: user.id,
        name: name || "My Schedule",
        day_of_week: dayOfWeek,
        building_names: buildingNames,
        parking_lot_name: parkingLotName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day_of_week" }
    )
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/");
  return data;
}

/**
 * Delete a saved route for a specific day of the week.
 */
export async function deleteSavedRoute(dayOfWeek: DayOfWeek) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not logged in");

  const { error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("user_id", user.id)
    .eq("day_of_week", dayOfWeek);

  if (error) throw error;
  revalidatePath("/");
}
