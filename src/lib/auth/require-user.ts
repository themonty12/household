import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "member";

export type CurrentProfile = {
  id: string;
  household_id: string;
  display_name: string;
  role: AppRole;
  status: "invited" | "active" | "disabled";
};

export async function requireUser() {
  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, household_id, display_name, role, status")
    .eq("id", userResult.user.id)
    .single();

  if (profileError || !profile || profile.status !== "active") {
    redirect("/login");
  }

  return { user: userResult.user, profile: profile as CurrentProfile, supabase };
}

export async function requireAdmin() {
  const context = await requireUser();

  if (context.profile.role !== "admin") {
    redirect("/today");
  }

  return context;
}
