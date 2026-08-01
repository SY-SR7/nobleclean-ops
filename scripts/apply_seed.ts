import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const supabase = createClient(url, key);

async function testAuth() {
  const credentials = [
    { email: "admin@nobleclean.de", password: "Demo@2026!" },
    { email: "nobleclean.private@gmail.com", password: "Demo@2026!" },
    { email: "nobleclean.private@gmail.com", password: "NobleClean2026!" },
    { email: "thomas.mueller@demo.nobleclean.de", password: "Demo@2026!" }
  ];

  for (const cred of credentials) {
    const { data, error } = await supabase.auth.signInWithPassword(cred);
    if (!error && data?.session) {
      console.log("SUCCESS LOGIN:", cred.email);
      const authenticatedSupabase = createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } }
      });
      const { data: clients } = await authenticatedSupabase.from("clients").select("id, name");
      const { data: profiles } = await authenticatedSupabase.from("profiles").select("id, full_name, role");
      console.log("Clients:", clients);
      console.log("Profiles:", profiles);
      return;
    } else {
      console.log("Failed for", cred.email, error?.message);
    }
  }
}

testAuth();
