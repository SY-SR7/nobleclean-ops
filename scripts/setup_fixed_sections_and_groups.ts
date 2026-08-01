import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

const CLIENT_ID = "c1a00000-0001-4000-8001-000000000001";

function toUUID(str: string): string {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

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

// REAL FIXED SECTIONS OF THE GYM (NOT GRUPPEN)
const fixedSections = [
  // 1. Eingangsbereich & Rezeption
  { key: "sec-eingang", parent_key: null, name: "Eingangsbereich & Rezeption", image: IMAGES.reception, order: 1 },
  { key: "sec-eingang-rezeption", parent_key: "sec-eingang", name: "Empfangstheke & Lounge", image: IMAGES.reception, order: 1 },
  { key: "sec-eingang-kids", parent_key: "sec-eingang", name: "KidsClub (Kinderbereich)", image: IMAGES.entrance, order: 2 },

  // 2. Cardio-Zone & Lounge
  { key: "sec-cardio", parent_key: null, name: "Cardio-Zone & Mitte", image: IMAGES.cardio, order: 2 },
  { key: "sec-cardio-geraete", parent_key: "sec-cardio", name: "Laufbänder & Crosstrainer", image: IMAGES.cardio, order: 1 },

  // 3. Kraftbereich & Freie Gewichte
  { key: "sec-kraft", parent_key: null, name: "Kraftbereich & Freie Gewichte (Hinten)", image: IMAGES.freeweights, order: 3 },
  { key: "sec-kraft-hanteln", parent_key: "sec-kraft", name: "Freie Gewichte & Hantelbänke", image: IMAGES.freeweights, order: 1 },
  { key: "sec-kraft-maschinen", parent_key: "sec-kraft", name: "Kraftmaschinen & Kabelzüge", image: IMAGES.strength, order: 2 },

  // 4. Herrenbereich
  { key: "sec-herren", parent_key: null, name: "Herrenbereich (Umkleide & Duschen)", image: IMAGES.lockers, order: 4 },
  { key: "sec-herren-umkleide", parent_key: "sec-herren", name: "Herren Umkleide (Lockers)", image: IMAGES.lockers, order: 1 },
  { key: "sec-herren-dusche", parent_key: "sec-herren", name: "Herren Dusche (Sanitär & Duschen)", image: IMAGES.sanitary, order: 2 },
  { key: "sec-herren-wc", parent_key: "sec-herren", name: "Herren WC (Waschtische & Toiletten)", image: IMAGES.sanitary, order: 3 },

  // 5. Damenbereich
  { key: "sec-damen", parent_key: null, name: "Damenbereich (Umkleide & WC)", image: IMAGES.lockers, order: 5 },
  { key: "sec-damen-komplett", parent_key: "sec-damen", name: "Frauen Umkleide & WC komplett", image: IMAGES.lockers, order: 1 },

  // 6. Wellness & Sauna
  { key: "sec-wellness", parent_key: null, name: "Wellness & Sauna", image: IMAGES.sauna, order: 6 },
  { key: "sec-wellness-sauna", parent_key: "sec-wellness", name: "Sauna & Ruhebereich", image: IMAGES.sauna, order: 1 },

  // 7. Studios & Kursräume
  { key: "sec-studios", parent_key: null, name: "Studios & Kursräume", image: IMAGES.strength, order: 7 },
  { key: "sec-studios-cycling", parent_key: "sec-studios", name: "Cyclingraum (Studio B)", image: IMAGES.cardio, order: 1 },
  { key: "sec-studios-kursraum", parent_key: "sec-studios", name: "Kursraum (Studio A & C)", image: IMAGES.strength, order: 2 },

  // 8. Korridore & Wege
  { key: "sec-wege", parent_key: null, name: "Hauptkorridore & Wege", image: IMAGES.scrubber, order: 8 },
  { key: "sec-wege-maschinen", parent_key: "sec-wege", name: "alle Wege mit Maschine", image: IMAGES.scrubber, order: 1 },
];

const leafItems = [
  // G1 Target Items
  { key: "item-01", sec: "sec-eingang-rezeption", name: "Empfangstheke & Glastüren desinfizieren", mins: 25, img: IMAGES.disinfectant, tag: "high_priority", group: "Gruppe 1" },
  { key: "item-02", sec: "sec-eingang-rezeption", name: "Drehkreuze & Zugangssysteme feucht wischen", mins: 20, img: IMAGES.entrance, tag: "normal", group: "Gruppe 1" },
  { key: "item-03", sec: "sec-eingang-kids", name: "KidsClub Spiel- & Liegeflächen desinfizieren", mins: 35, img: IMAGES.entrance, tag: "high_priority", group: "Gruppe 1" },
  { key: "item-04", sec: "sec-eingang-kids", name: "KidsClub Spielzeug & Schränke abwischen", mins: 25, img: IMAGES.disinfectant, tag: "normal", group: "Gruppe 1" },
  { key: "item-05", sec: "sec-herren-dusche", name: "Herren Dusche Kacheln & Abflüsse entkalken", mins: 45, img: IMAGES.sanitary, tag: "high_priority", group: "Gruppe 1" },
  { key: "item-06", sec: "sec-cardio-geraete", name: "Cardio-Geräte Konsolen & Griffe reinigen", mins: 45, img: IMAGES.cardio, tag: "normal", group: "Gruppe 1" },

  // G2 Target Items
  { key: "item-07", sec: "sec-kraft-hanteln", name: "Freie Gewichte & Hantelbänke desinfizieren", mins: 40, img: IMAGES.freeweights, tag: "high_priority", group: "Gruppe 2" },
  { key: "item-08", sec: "sec-kraft-maschinen", name: "Kraftmaschinen Kabelzüge & Polster abwischen", mins: 35, img: IMAGES.strength, tag: "normal", group: "Gruppe 2" },
  { key: "item-09", sec: "sec-herren-wc", name: "Herren WC Mirrors, Waschtische & Surfaces", mins: 40, img: IMAGES.sanitary, tag: "high_priority", group: "Gruppe 2" },
  { key: "item-10", sec: "sec-herren-umkleide", name: "Herren Umkleide Lockers & Benches wischen", mins: 35, img: IMAGES.lockers, tag: "normal", group: "Gruppe 2" },
  { key: "item-11", sec: "sec-wege-maschinen", name: "alle Wege mit Scheuersaugmaschine nassreinigen", mins: 40, img: IMAGES.scrubber, tag: "high_priority", group: "Gruppe 2" },

  // G3 Target Items
  { key: "item-12", sec: "sec-damen-komplett", name: "Frauen Umkleide & WC komplett desinfizieren", mins: 55, img: IMAGES.lockers, tag: "high_priority", group: "Gruppe 3" },
  { key: "item-13", sec: "sec-wellness-sauna", name: "Wellness & Sauna Liegebänke & Aufguss reinigen", mins: 45, img: IMAGES.sauna, tag: "high_priority", group: "Gruppe 3" },
  { key: "item-14", sec: "sec-studios-cycling", name: "Indoor-Cycling Bikes & Pedale desinfizieren", mins: 45, img: IMAGES.cardio, tag: "normal", group: "Gruppe 3" },
  { key: "item-15", sec: "sec-studios-kursraum", name: "Kursraum Matten, Spiegel & Schwingboden wischen", mins: 40, img: IMAGES.strength, tag: "normal", group: "Gruppe 3" },
];

async function run() {
  const supabase = createClient(url, key);
  const loginRes = await supabase.auth.signInWithPassword({
    email: "admin@nobleclean.de",
    password: "Demo@2026!",
  });

  if (loginRes.error || !loginRes.data.session) {
    console.error("Login failed:", loginRes.error?.message);
    return;
  }

  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${loginRes.data.session.access_token}` } },
  });

  console.log("Starting Fixed Sections & Groups reconstruction...");

  // Clear existing items and sections
  const { data: existingSecs } = await db.from("sections").select("id").eq("client_id", CLIENT_ID);
  if (existingSecs && existingSecs.length > 0) {
    const secIds = existingSecs.map(s => s.id);
    await db.from("leaf_items").delete().in("section_id", secIds);
    await db.from("sections").delete().eq("client_id", CLIENT_ID);
  }

  // Insert Main Fixed Sections
  for (const s of fixedSections.filter(s => !s.parent_key)) {
    const { error } = await db.from("sections").insert({
      id: toUUID(s.key),
      client_id: CLIENT_ID,
      parent_section_id: null,
      name: s.name,
      reference_image_path: s.image,
      sort_order: s.order,
    });
    if (error) console.error("Error main section:", s.name, error.message);
  }

  // Insert Sub Sections
  for (const s of fixedSections.filter(s => s.parent_key)) {
    const { error } = await db.from("sections").insert({
      id: toUUID(s.key),
      client_id: CLIENT_ID,
      parent_section_id: toUUID(s.parent_key!),
      name: s.name,
      reference_image_path: s.image,
      sort_order: s.order,
    });
    if (error) console.error("Error sub section:", s.name, error.message);
  }

  // Insert Leaf Items
  for (const item of leafItems) {
    const { error } = await db.from("leaf_items").insert({
      id: toUUID(item.key),
      section_id: toUUID(item.sec),
      name: item.name,
      quantity: 1,
      estimated_minutes: item.mins,
      recurrence_days: 1,
      tag: item.tag,
      reference_image_path: item.img,
      notes: `Zugewiesen zu: ${item.group}`,
    });
    if (error) console.error("Error leaf item:", item.name, error.message);
  }

  console.log("SUCCESS! Fixed Sections Tree reconstructed cleanly!");
}

run().catch(err => console.error(err));
