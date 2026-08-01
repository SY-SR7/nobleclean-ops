import { createClient } from "@supabase/supabase-js";

const url = "https://dnjrxvhfzayxvtgsnomq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJ4dmhmemF5eHZ0Z3Nub21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTg5OTgsImV4cCI6MjEwMDk5NDk5OH0.s_pd3WnMRElErp5eJVkYTE3PNbEhInsz9wzU7sGxaXk";

async function main() {
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

  console.log("Logged in. Ensuring audit_logs table...");

  const initialLogs = [
    {
      action: "INSERT",
      table_name: "daily_plans",
      record_id: "plan-august-01",
      user_id: loginRes.data.user?.id,
      changes: {
        after: { client_name: "John Reed Fitness", work_date: "2026-08-01", status: "submitted" },
        _meta: { user_email: "admin@nobleclean.de", description: "Arbeitsplan für 01.08.2026 erstellt" }
      },
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      action: "UPDATE",
      table_name: "work_schedule",
      record_id: "sched-eghbal-01",
      user_id: loginRes.data.user?.id,
      changes: {
        before: { allocated_hours: 3.0, start_time: "04:00" },
        after: { allocated_hours: 6.0, start_time: "01:00", end_time: "07:00" },
        diff: {
          before: { allocated_hours: 3.0, shift: "04:00 - 07:00" },
          after: { allocated_hours: 6.0, shift: "01:00 - 07:00" }
        },
        _meta: { user_email: "admin@nobleclean.de", description: "Schichtzeiten für Eghbal auf 6.0h angepasst (01:00 - 07:00)" }
      },
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
    },
    {
      action: "UPDATE",
      table_name: "sections",
      record_id: "sec-gruppe-3",
      user_id: loginRes.data.user?.id,
      changes: {
        before: { name: "Gruppe 3 — Alte Struktur" },
        after: { name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum" },
        diff: {
          before: { name: "Gruppe 3 — Alte Struktur" },
          after: { name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum" }
        },
        _meta: { user_email: "admin@nobleclean.de", description: "Neue 3-Gruppen Struktur in Standard-Tagesplan hinterlegt" }
      },
      created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
    },
    {
      action: "INSERT",
      table_name: "leaf_items",
      record_id: "item-sauna-bank",
      user_id: loginRes.data.user?.id,
      changes: {
        after: { name: "Saunabänke Desinfektion", section: "Wellness & Sauna", estimated_minutes: 15 },
        _meta: { user_email: "admin@nobleclean.de", description: "Neues Reinigungsobjekt 'Saunabänke Desinfektion' hinzugefügt" }
      },
      created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
    },
    {
      action: "ASSIGN",
      table_name: "staff_assignments",
      record_id: "assign-khalid-jrf",
      user_id: loginRes.data.user?.id,
      changes: {
        after: { employee_name: "Khalid", client_name: "John Reed Fitness", start_date: "2026-07-01" },
        _meta: { user_email: "admin@nobleclean.de", description: "Mitarbeiter Khalid zu John Reed Fitness zugewiesen" }
      },
      created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
    }
  ];

  const { data, error } = await db.from("audit_logs").insert(initialLogs).select();
  if (error) {
    console.log("Error inserting audit logs:", error.message);
  } else {
    console.log("Successfully inserted sample audit logs!", data.length);
  }
}

main();
