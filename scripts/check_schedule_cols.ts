import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

async function addShiftColumns() {
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
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  console.log("Checking work_schedule table structure...");
  const { data: scheduleSample } = await db.from("work_schedule").select("*").limit(1);
  console.log("Sample schedule row:", scheduleSample?.[0]);
}

addShiftColumns().catch(err => console.error(err));
