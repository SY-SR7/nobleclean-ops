import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const CLIENT_ID = "c1a00000-0001-4000-8001-000000000001";

async function verify() {
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

  console.log("=== COMPREHENSIVE VERIFICATION REPORT ===");

  // 1. PROFILES & EMPLOYEES
  const { data: profiles } = await db.from("profiles").select("id, full_name, role").eq("role", "employee");
  console.log("\n1. Staff Profiles (Count:", profiles?.length, "):");
  profiles?.forEach(p => console.log(`   - ${p.full_name} (${p.id})`));

  // 2. SECTIONS & GROUPS
  const { data: sections } = await db.from("sections").select("id, name, parent_section_id, reference_image_path").eq("client_id", CLIENT_ID);
  console.log("\n2. Sections Tree (Count:", sections?.length, "):");
  const mainSecs = sections?.filter(s => !s.parent_section_id) || [];
  mainSecs.forEach(ms => {
    console.log(`   [Main] ${ms.name} (Image: ${ms.reference_image_path ? 'YES' : 'NO'})`);
    const subSecs = sections?.filter(s => s.parent_section_id === ms.id) || [];
    subSecs.forEach(ss => {
      console.log(`     ├── [Sub] ${ss.name} (Image: ${ss.reference_image_path ? 'YES' : 'NO'})`);
    });
  });

  // 3. LEAF ITEMS & TIME TOTALS
  const { data: leafItems } = await db.from("leaf_items").select("id, name, estimated_minutes, reference_image_path, section_id");
  console.log("\n3. Leaf Items (Count:", leafItems?.length, "):");
  let totalMins = 0;
  leafItems?.forEach(item => {
    totalMins += item.estimated_minutes;
    console.log(`   - ${item.name} (${item.estimated_minutes} min) (Image: ${item.reference_image_path ? 'YES' : 'NO'})`);
  });
  console.log(`   TOTAL ESTIMATED MINUTES ACROSS ALL GROUPS: ${totalMins} min (${(totalMins / 60).toFixed(2)} hours)`);

  // 4. WORK SCHEDULE (MONTH 7 & MONTH 8 SCOPE CHECK)
  const { data: schedules } = await db.from("work_schedule").select("id, work_date, employee_id, allocated_hours");
  const augScheds = schedules?.filter(s => s.work_date.startsWith("2026-08")) || [];
  const julScheds = schedules?.filter(s => s.work_date.startsWith("2026-07")) || [];
  const outsideScheds = schedules?.filter(s => !s.work_date.startsWith("2026-08") && !s.work_date.startsWith("2026-07")) || [];

  console.log("\n4. Work Schedules:");
  console.log(`   - July 2026 Schedules Count: ${julScheds.length}`);
  console.log(`   - August 2026 Schedules Count: ${augScheds.length}`);
  console.log(`   - Schedules Outside July & August: ${outsideScheds.length} (MUST BE ZERO)`);

  // 5. DAILY PLANS
  const { data: plans } = await db.from("daily_plans").select("id, work_date, status");
  const augPlans = plans?.filter(p => p.work_date.startsWith("2026-08")) || [];
  const julPlans = plans?.filter(p => p.work_date.startsWith("2026-07")) || [];
  const outsidePlans = plans?.filter(p => !p.work_date.startsWith("2026-08") && !p.work_date.startsWith("2026-07")) || [];

  console.log("\n5. Daily Plans:");
  console.log(`   - July 2026 Plans Count: ${julPlans.length}`);
  console.log(`   - August 2026 Plans Count: ${augPlans.length}`);
  console.log(`   - Plans Outside July & August: ${outsidePlans.length} (MUST BE ZERO)`);

  console.log("\n=== VERIFICATION FINISHED ===");
}

verify().catch(err => console.error("Verification error:", err));
