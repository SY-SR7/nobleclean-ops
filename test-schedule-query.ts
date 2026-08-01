import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const supabase = createClient(supabaseUrl, anonKey);

async function testQuery() {
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

  const [
    { data: employeeRows, error: employeeError },
    { data: clientRows, error: clientError },
    { data: scheduleRows, error: scheduleError },
  ] = await Promise.all([
    authedClient
      .from("profiles")
      .select("id, full_name, default_daily_hours")
      .eq("role", "employee")
      .order("full_name", { ascending: true }),
    authedClient
      .from("clients")
      .select("id, name, is_active")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true }),
    authedClient
      .from("work_schedule")
      .select("id, employee_id, client_id, work_date, allocated_hours")
      .gte("work_date", "2026-08-01")
      .lte("work_date", "2026-08-31")
      .order("work_date", { ascending: true }),
  ]);

  console.log("employeeError:", employeeError?.message, "Count:", employeeRows?.length);
  console.log("clientError:", clientError?.message, "Count:", clientRows?.length);
  console.log("scheduleError:", scheduleError?.message, "Count:", scheduleRows?.length);
}

testQuery();
