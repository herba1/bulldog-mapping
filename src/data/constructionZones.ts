import { createClient } from "@/utils/supabase/server";
import { ConstructionZone } from "@/types/constructionZone";
import { Tables } from "@/types/supabase";

type ConstructionZoneRow = Tables<"construction_zones">;

/**
 * Convert database row to ConstructionZone type
 */
function rowToConstructionZone(row: ConstructionZoneRow): ConstructionZone {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    geojson: row.geojson as any,
    isActive: row.is_active,
    isApproved: row.is_approved,
    startDate: row.start_date,
    endDate: row.end_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all active and approved construction zones (public)
 * These are the zones that affect routing
 */
export async function getActiveConstructionZones(): Promise<ConstructionZone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_zones")
    .select("*")
    .eq("is_active", true)
    .eq("is_approved", true);

  if (error) {
    console.warn("Error fetching active construction zones:", error);
    return [];
  }

  return (data || []).map(rowToConstructionZone);
}

/**
 * Get all construction zones (admin only)
 */
export async function getAllConstructionZones(): Promise<ConstructionZone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_zones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching all construction zones:", error);
    return [];
  }

  return (data || []).map(rowToConstructionZone);
}

/**
 * Get a single construction zone by ID
 */
export async function getConstructionZone(
  id: string
): Promise<ConstructionZone | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_zones")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("Error fetching construction zone:", error);
    return null;
  }

  return data ? rowToConstructionZone(data) : null;
}
