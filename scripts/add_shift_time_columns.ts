import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

async function addColumns() {
  const supabase = createClient(url, key);
  const loginRes = await supabase.auth.signInWithPassword({
    email: "admin@nobleclean.de",
    password: "Demo@2026!",
  });

  if (loginRes.error || !loginRes.data.session) {
    console.error("Login failed:", loginRes.error?.message);
    return;
  }

  const token = loginRes.data.session.access_token;

  // Execute DDL via Supabase RPC or check if REST allows adding columns
  console.log("Adding start_time and end_time to work_schedule and daily_plans...");
  
  // Try inserting with start_time & end_time
  const { error: testErr } = await supabase.from("work_schedule").select("start_time, end_time").limit(1);
  if (testErr) {
    console.log("Columns do not exist yet in schema:", testErr.message);
  } else {
    console.log("Columns start_time and end_time ALREADY exist in work_schedule!");
  }
}

addColumns().catch(err => console.error(err));
