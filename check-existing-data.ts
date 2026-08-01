import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "nobleclean.private@gmail.com",
    password: "NobleClean2026!",
  });

  if (!authData?.session) {
    console.log("No session!");
    return;
  }

  const authedClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });

  // Query clients
  const { data: clients, error: clientsErr } = await authedClient.from("clients").select("id, name");
  console.log("Clients count:", clients?.length, "Clients:", clients, "Error:", clientsErr?.message);

  // Query profiles
  const { data: profiles, error: profErr } = await authedClient.from("profiles").select("id, full_name, role");
  console.log("Profiles count:", profiles?.length, "Profiles:", profiles, "Error:", profErr?.message);

  // Query work_schedule
  const { data: schedule, error: schedErr } = await authedClient.from("work_schedule").select("id, work_date").limit(5);
  console.log("Schedule count:", schedule?.length, "Schedule:", schedule, "Error:", schedErr?.message);
}

check();
