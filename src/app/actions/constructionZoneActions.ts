"use server";

import { createClient } from "@/utils/supabase/server";
import { ConstructionZoneFormData } from "@/types/constructionZone";
import { revalidatePath } from "next/cache";

/**
 * Verify user is admin (follows event approval pattern)
 */
async function verifyAdmin(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not logged in");

  const { data, error } = await supabase
    .from("campusAdmin")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.user_id) throw new Error("User is not an admin");

  return user.id;
}

/**
 * Create a new construction zone (any authenticated user)
 * Auto-approves if created by admin, otherwise requires approval
 */
export async function createConstructionZone(formData: ConstructionZoneFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not logged in");

  // Check if user is admin
  const { data: adminData } = await supabase
    .from("campusAdmin")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = !!adminData?.user_id;

  const { data, error } = await supabase
    .from("construction_zones")
    .insert({
      name: formData.name,
      description: formData.description || null,
      geojson: formData.geojson as any,
      is_active: formData.isActive,
      is_approved: isAdmin, // Auto-approve if admin, otherwise false
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data;
}

/**
 * Update a construction zone (admin only)
 */
export async function updateConstructionZone(
  id: string,
  formData: Partial<ConstructionZoneFormData>
) {
  await verifyAdmin();
  const supabase = await createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (formData.name) updateData.name = formData.name;
  if (formData.description !== undefined)
    updateData.description = formData.description;
  if (formData.geojson) updateData.geojson = formData.geojson;
  if (formData.isActive !== undefined) updateData.is_active = formData.isActive;
  if (formData.startDate !== undefined)
    updateData.start_date = formData.startDate;
  if (formData.endDate !== undefined) updateData.end_date = formData.endDate;

  const { data, error } = await supabase
    .from("construction_zones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data;
}

/**
 * Toggle active status of a construction zone (admin only)
 */
export async function toggleConstructionZone(id: string, isActive: boolean) {
  await verifyAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_zones")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data;
}

/**
 * Delete a construction zone (admin only)
 */
export async function deleteConstructionZone(id: string) {
  await verifyAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("construction_zones")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/");
}

/**
 * Approve a construction zone (admin only)
 */
export async function approveConstructionZone(id: string) {
  await verifyAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_zones")
    .update({
      is_approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data;
}
