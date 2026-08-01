import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data: profiles, error } = await supabase.from("profiles").select("*");
  console.log("All profiles:", profiles, "Error:", error?.message);
}

check();
