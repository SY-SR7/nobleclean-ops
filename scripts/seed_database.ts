import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const CLIENT_ID = "c1a00000-0001-4000-8001-000000000001";

function toUUID(str: string): string {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

// Fixed UUIDs for existing 4 auth.users
const employees = [
  { id: "e1a00000-0001-4000-8001-000000000001", name: "Mohamad", email: "mohamad@demo.nobleclean.de" },
  { id: "e2a00000-0002-4000-8002-000000000002", name: "Eghbal",  email: "eghbal@demo.nobleclean.de" },
  { id: "e3a00000-0003-4000-8003-000000000003", name: "Hady",    email: "hady@demo.nobleclean.de" },
  { id: "e4a00000-0004-4000-8004-000000000004", name: "Shaikh",  email: "shaikh@demo.nobleclean.de" },
  { id: "", name: "Ammar",   email: "ammar.worker@demo.nobleclean.de" },
  { id: "", name: "Khalid",  email: "khalid.worker@demo.nobleclean.de" },
];

// August 2026 Schedule from PDF
const pdfAugustSchedule: [string, (string | [string, string, string])[]][] = [
  ["2026-08-01", ["Mohamad", "Eghbal", "Hady"]],
  ["2026-08-02", ["Mohamad", "Shaikh", "Hady"]],
  ["2026-08-03", ["Eghbal", "Ammar", "Shaikh"]],
  ["2026-08-04", ["Eghbal", "Ammar", "Shaikh"]],
  ["2026-08-05", ["Mohamad", "Eghbal", "Shaikh"]],
  ["2026-08-06", ["Mohamad", "Ammar", "Shaikh"]],
  ["2026-08-07", ["Eghbal", "Ammar", "Shaikh"]],
  ["2026-08-08", ["Mohamad", "Shaikh", "Hady"]],
  ["2026-08-09", ["Mohamad", "Shaikh", "Hady"]],
  ["2026-08-10", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-11", ["Mohamad", "Eghbal", "Shaikh"]],
  ["2026-08-12", ["Eghbal", "Ammar", "Shaikh"]],
  ["2026-08-13", ["Mohamad", "Eghbal", "Shaikh"]],
  ["2026-08-14", [["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"], ["Shaikh", "04:00", "07:00"]]],
  ["2026-08-15", ["Mohamad", "Shaikh", "Hady"]],
  ["2026-08-16", ["Ammar", "Shaikh", "Hady"]],
  ["2026-08-17", [["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"], ["Ammar", "04:00", "07:00"]]],
  ["2026-08-18", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-19", [["Mohamad", "04:00", "07:00"], ["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"]]],
  ["2026-08-20", [["Mohamad", "04:00", "07:00"], ["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"]]],
  ["2026-08-21", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-22", ["Mohamad", "Ammar", "Hady"]],
  ["2026-08-23", ["Mohamad", "Ammar", "Hady"]],
  ["2026-08-24", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-25", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-26", [["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"], ["Ammar", "04:00", "07:00"]]],
  ["2026-08-27", [["Eghbal", "01:00", "04:00"], ["Eghbal", "04:00", "07:00"], ["Shaikh", "04:00", "07:00"]]],
  ["2026-08-28", ["Mohamad", "Eghbal", "Ammar"]],
  ["2026-08-29", ["Mohamad", "Shaikh", "Hady"]],
  ["2026-08-30", ["Mohamad", "Ammar", "Hady"]],
  ["2026-08-31", ["Mohamad", "Eghbal", "Ammar"]],
];

// Reference Images
const IMAGES = {
  reception: "gym_reception_area_1785431564920.jpg",
  entrance: "gym_entrance_clean_1785557927120.jpg",
  cardio: "gym_cardio_clean_1785557910901.jpg",
  strength: "gym_strength_clean_1785557941366.jpg",
  freeweights: "gym_free_weights_1785431587480.jpg",
  lockers: "gym_locker_room_1785431598599.jpg",
  sanitary: "gym_sanitary_clean_1785557970209.jpg",
  sauna: "gym_sauna_clean_1785557955666.jpg",
  scrubber: "tool_scrubber_1785431699038.jpg",
  disinfectant: "tool_disinfectant_1785431718558.jpg",
  mop: "tool_mop_1785431708083.jpg",
};

// 3 Groups Sections
const rawSections = [
  // MAIN SECTIONS
  { key: "sec-g1-main", parent_key: null, name: "Gruppe 1 — Vorne, KidsClub, Herren Dusche, Mitte", image: IMAGES.reception, order: 1 },
  { key: "sec-g2-main", parent_key: null, name: "Gruppe 2 — Hinten, Herren WC, Herren Umkleide, Wege", image: IMAGES.strength, order: 2 },
  { key: "sec-g3-main", parent_key: null, name: "Gruppe 3 — Frauen komplett, Wellness, Cycling, Kursraum", image: IMAGES.sauna, order: 3 },

  // SUB SECTIONS G1
  { key: "sec-g1-vorne", parent_key: "sec-g1-main", name: "Vorne (Empfang & Rezeption)", image: IMAGES.reception, order: 1 },
  { key: "sec-g1-kids", parent_key: "sec-g1-main", name: "KidsClub (Kinderbereich)", image: IMAGES.entrance, order: 2 },
  { key: "sec-g1-hdusche", parent_key: "sec-g1-main", name: "Herren Dusche (Sanitär & Duschen)", image: IMAGES.sanitary, order: 3 },
  { key: "sec-g1-mitte", parent_key: "sec-g1-main", name: "Mitte (Cardio & Lounge)", image: IMAGES.cardio, order: 4 },

  // SUB SECTIONS G2
  { key: "sec-g2-hinten", parent_key: "sec-g2-main", name: "Hinten (Kraftbereich & Freie Gewichte)", image: IMAGES.freeweights, order: 1 },
  { key: "sec-g2-hwc", parent_key: "sec-g2-main", name: "Herren WC (Toiletten & Waschtische)", image: IMAGES.sanitary, order: 2 },
  { key: "sec-g2-humkleide", parent_key: "sec-g2-main", name: "Herren Umkleide (Locker Room)", image: IMAGES.lockers, order: 3 },
  { key: "sec-g2-wege", parent_key: "sec-g2-main", name: "alle Wege mit Maschine (Hauptkorridore)", image: IMAGES.scrubber, order: 4 },

  // SUB SECTIONS G3
  { key: "sec-g3-frauen", parent_key: "sec-g3-main", name: "Frauen komplett (Umkleide & WC Damen)", image: IMAGES.lockers, order: 1 },
  { key: "sec-g3-wellness", parent_key: "sec-g3-main", name: "Wellness & Sauna (Ruhebereich)", image: IMAGES.sauna, order: 2 },
  { key: "sec-g3-cycling", parent_key: "sec-g3-main", name: "Cyclingraum (Studio B)", image: IMAGES.cardio, order: 3 },
  { key: "sec-g3-kursraum", parent_key: "sec-g3-main", name: "Kursraum (Studio A & C)", image: IMAGES.strength, order: 4 },
];

const sectionsData = rawSections.map(s => ({
  id: toUUID(s.key),
  parent_id: s.parent_key ? toUUID(s.parent_key) : null,
  name: s.name,
  image: s.image,
  order: s.order
}));

// LEAF ITEMS
const rawLeafItems = [
  // G1 Items (Total = 195 min)
  { key: "item-g1-01", sec_key: "sec-g1-vorne", name: "Empfangstheke & Glastüren desinfizieren", mins: 25, image: IMAGES.disinfectant, tag: "high_priority" },
  { key: "item-g1-02", sec_key: "sec-g1-vorne", name: "Drehkreuze & Zugangssysteme feucht wischen", mins: 20, image: IMAGES.entrance, tag: "normal" },
  { key: "item-g1-03", sec_key: "sec-g1-kids", name: "KidsClub Spiel- & Liegeflächen desinfizieren", mins: 35, image: IMAGES.entrance, tag: "high_priority" },
  { key: "item-g1-04", sec_key: "sec-g1-kids", name: "KidsClub Spielzeug & Schränke abwischen", mins: 25, image: IMAGES.disinfectant, tag: "normal" },
  { key: "item-g1-05", sec_key: "sec-g1-hdusche", name: "Herren Dusche Kacheln & Abflüsse entkalken", mins: 45, image: IMAGES.sanitary, tag: "high_priority" },
  { key: "item-g1-06", sec_key: "sec-g1-mitte", name: "Cardio-Geräte Konsolen & Griffe reinigen", mins: 45, image: IMAGES.cardio, tag: "normal" },

  // G2 Items (Total = 190 min)
  { key: "item-g2-01", sec_key: "sec-g2-hinten", name: "Freie Gewichte & Hantelbänke desinfizieren", mins: 40, image: IMAGES.freeweights, tag: "high_priority" },
  { key: "item-g2-02", sec_key: "sec-g2-hinten", name: "Kraftmaschinen Kabelzüge & Polster abwischen", mins: 35, image: IMAGES.strength, tag: "normal" },
  { key: "item-g2-03", sec_key: "sec-g2-hwc", name: "Herren WC Mirrors, Waschtische & Surfaces", mins: 40, image: IMAGES.sanitary, tag: "high_priority" },
  { key: "item-g2-04", sec_key: "sec-g2-humkleide", name: "Herren Umkleide Lockers & Benches wischen", mins: 35, image: IMAGES.lockers, tag: "normal" },
  { key: "item-g2-05", sec_key: "sec-g2-wege", name: "alle Wege mit Scheuersaugmaschine nassreinigen", mins: 40, image: IMAGES.scrubber, tag: "high_priority" },

  // G3 Items (Total = 185 min)
  { key: "item-g3-01", sec_key: "sec-g3-frauen", name: "Frauen Umkleide & WC komplett desinfizieren", mins: 55, image: IMAGES.lockers, tag: "high_priority" },
  { key: "item-g3-02", sec_key: "sec-g3-wellness", name: "Wellness & Sauna Liegebänke & Aufguss reinigen", mins: 45, image: IMAGES.sauna, tag: "high_priority" },
  { key: "item-g3-03", sec_key: "sec-g3-cycling", name: "Indoor-Cycling Bikes & Pedale desinfizieren", mins: 45, image: IMAGES.cardio, tag: "normal" },
  { key: "item-g3-04", sec_key: "sec-g3-kursraum", name: "Kursraum Matten, Spiegel & Schwingboden wischen", mins: 40, image: IMAGES.strength, tag: "normal" },
];

const leafItemsData = rawLeafItems.map(i => ({
  id: toUUID(i.key),
  section_id: toUUID(i.sec_key),
  name: i.name,
  mins: i.mins,
  image: i.image,
  tag: i.tag
}));

async function seed() {
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

  console.log("Logged in successfully. Starting database update...");

  // Ensure Ammar and Khalid users
  for (const emp of employees) {
    if (!emp.id) {
      const signupRes = await supabase.auth.signUp({
        email: emp.email,
        password: "Demo@2026!",
      });
      if (signupRes.data.user?.id) {
        emp.id = signupRes.data.user.id;
      } else {
        const signInRes = await supabase.auth.signInWithPassword({
          email: emp.email,
          password: "Demo@2026!",
        });
        if (signInRes.data.user?.id) {
          emp.id = signInRes.data.user.id;
        }
      }
    }
  }

  const empMap: Record<string, string> = {};
  employees.forEach(e => { empMap[e.name] = e.id; });
  empMap["Shaik"] = empMap["Shaikh"];

  // 1. UPDATE EMPLOYEES PROFILES
  console.log("1. Updating Employee Profiles...");
  for (const emp of employees) {
    if (!emp.id) continue;
    await db.from("profiles").upsert({
      id: emp.id,
      full_name: emp.name,
      role: "employee",
      default_daily_hours: 3.0,
    });
  }

  // 2. CASCADING DELETE OF OLD PLAN DATA & SECTIONS
  console.log("2. Performing cascading delete of old sections and plans...");
  await db.from("daily_plan_item_steps").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("daily_plan_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("daily_plans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("work_schedule").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("cleaning_tool_steps").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("leaf_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("sections").delete().eq("client_id", CLIENT_ID);

  // 3. RECONSTRUCT SECTIONS & LEAF ITEMS
  console.log("3. Inserting 3-Group Sections...");
  for (const s of sectionsData.filter(s => !s.parent_id)) {
    const { error } = await db.from("sections").insert({
      id: s.id,
      client_id: CLIENT_ID,
      parent_section_id: null,
      name: s.name,
      reference_image_path: s.image,
      sort_order: s.order,
    });
    if (error) console.error("Error inserting main section", s.name, error.message);
  }

  for (const s of sectionsData.filter(s => s.parent_id)) {
    const { error } = await db.from("sections").insert({
      id: s.id,
      client_id: CLIENT_ID,
      parent_section_id: s.parent_id,
      name: s.name,
      reference_image_path: s.image,
      sort_order: s.order,
    });
    if (error) console.error("Error inserting sub section", s.name, error.message);
  }

  console.log("4. Inserting Leaf Items with Images...");
  for (const item of leafItemsData) {
    const { error } = await db.from("leaf_items").insert({
      id: item.id,
      section_id: item.section_id,
      name: item.name,
      quantity: 1,
      estimated_minutes: item.mins,
      recurrence_days: 1,
      tag: item.tag,
      reference_image_path: item.image,
    });
    if (error) console.error("Error inserting leaf item", item.name, error.message);
  }

  // 5. SEED AUGUST 2026 SCHEDULE (PDF 100%)
  console.log("5. Seeding August 2026 Schedule (100% PDF)...");
  for (const [work_date, workers] of pdfAugustSchedule) {
    for (const w of workers) {
      const empName = Array.isArray(w) ? w[0] : w;
      const empId = empMap[empName];
      if (!empId) continue;

      const uuidSchedId = toUUID(`sched-${work_date}-${empId}`);
      const uuidPlanId = toUUID(`plan-${work_date}-${empId}`);

      await db.from("work_schedule").insert({
        id: uuidSchedId,
        employee_id: empId,
        client_id: CLIENT_ID,
        work_date,
        allocated_hours: 3.0,
      });

      const isSubmitted = work_date <= "2026-08-01";
      await db.from("daily_plans").insert({
        id: uuidPlanId,
        employee_id: empId,
        client_id: CLIENT_ID,
        work_date,
        status: isSubmitted ? "submitted" : "in_progress",
        submitted_at: isSubmitted ? `${work_date}T12:00:00Z` : null,
      });

      for (const item of leafItemsData) {
        const uuidItemId = toUUID(`pi-${uuidPlanId}-${item.id}`);
        await db.from("daily_plan_items").insert({
          id: uuidItemId,
          daily_plan_id: uuidPlanId,
          leaf_item_id: item.id,
          is_completed: isSubmitted,
          completed_at: isSubmitted ? `${work_date}T10:00:00Z` : null,
        });
      }
    }
  }

  // 6. SEED JULY 2026 SCHEDULE (Random Realistic)
  console.log("6. Seeding July 2026 Schedule...");
  const empNames = employees.map(e => e.name);
  for (let day = 1; day <= 31; day++) {
    const work_date = `2026-07-${String(day).padStart(2, "0")}`;
    const workers = [empNames[(day - 1) % 6], empNames[day % 6], empNames[(day + 1) % 6]];

    for (const empName of workers) {
      const empId = empMap[empName];
      if (!empId) continue;
      const uuidSchedId = toUUID(`sched-${work_date}-${empId}`);
      const uuidPlanId = toUUID(`plan-${work_date}-${empId}`);

      await db.from("work_schedule").insert({
        id: uuidSchedId,
        employee_id: empId,
        client_id: CLIENT_ID,
        work_date,
        allocated_hours: 3.0,
      });

      await db.from("daily_plans").insert({
        id: uuidPlanId,
        employee_id: empId,
        client_id: CLIENT_ID,
        work_date,
        status: "submitted",
        submitted_at: `${work_date}T12:00:00Z`,
      });

      for (const item of leafItemsData) {
        const uuidItemId = toUUID(`pi-${uuidPlanId}-${item.id}`);
        await db.from("daily_plan_items").insert({
          id: uuidItemId,
          daily_plan_id: uuidPlanId,
          leaf_item_id: item.id,
          is_completed: true,
          completed_at: `${work_date}T10:00:00Z`,
        });
      }
    }
  }

  console.log("🎉 SUCCESS! Database update completed flawlessly!");
}

seed().catch(err => console.error("Database update error:", err));
