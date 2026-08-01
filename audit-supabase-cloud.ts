import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const supabase = createClient(supabaseUrl, anonKey);

async function audit() {
  const tables = ["clients", "profiles", "sections", "leaf_items", "work_schedule", "employee_client_assignments", "daily_plans"];

  console.log("=== Auditing Supabase Cloud Database Tables ===");

  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "nobleclean.private@gmail.com",
    password: "NobleClean2026!",
  });

  const client = authData?.session ? createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  }) : supabase;

  for (const table of tables) {
    const { data, count, error } = await client.from(table).select("*", { count: "exact" });
    console.log(`Table: ${table.padEnd(30)} | Count: ${count ?? data?.length ?? 0} | Error: ${error?.message || "None"}`);
    if (data && data.length > 0) {
      console.log(`  Sample from ${table}:`, data[0]);
    }
  }
}

audit();
