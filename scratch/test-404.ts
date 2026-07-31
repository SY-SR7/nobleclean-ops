import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

async function main() {
  const client = createClient(url, anonKey);
  const { data: authData } = await client.auth.signInWithPassword({
    email: "nobleclean.private@gmail.com",
    password: "NobleClean2026!",
  });

  if (!authData.session) {
    console.log("No session!");
    return;
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
  });

  const clientId = "c1a00000-0001-4000-8001-000000000001";

  const { data: clientRow, error: clientError } = await userClient
    .from("clients")
    .select("id, name, address, contact_info, is_active, avatar_path")
    .eq("id", clientId)
    .maybeSingle();

  console.log("=== CLIENT ROW ===", { clientRow, clientError });

  const { data: profileRow, error: profileError } = await userClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", authData.user!.id)
    .single();

  console.log("=== PROFILE ROW ===", { profileRow, profileError });
}

main().catch(console.error);
