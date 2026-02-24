"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function loginWithGoogle() {
  const supabase = await createClient();
  const provider = "google";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: process.env.SITE_URL
        ? `${process.env.SITE_URL}/auth/callback`
        : "http://localhost:3000/auth/callback",
    },
  });
  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error);
    // Return error message instead of redirecting
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  console.log("Attempting signup for:", data.email);

  const { data: signupData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: process.env.SITE_URL
        ? `${process.env.SITE_URL}/auth/callback`
        : "http://localhost:3000/auth/callback",
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return { error: error.message };
  }

  console.log("Signup successful:", signupData);

  // If email confirmation is required, inform the user
  if (signupData.user && !signupData.session) {
    return {
      error:
        "Please check your email to confirm your account before logging in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
