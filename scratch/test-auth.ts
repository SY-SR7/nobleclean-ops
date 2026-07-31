import { createClient } from "@supabase/supabase-js";

const url = "http://127.0.0.1:54321";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function main() {
  const supabase = createClient(url, anonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "nobleclean.private@gmail.com",
    password: "NobleClean2026!",
  });

  console.log("Auth result:", {
    user: authData.user?.email,
    userId: authData.user?.id,
    authError,
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", authData.user!.id)
    .single();

  console.log("Profile query result:", { profile, profileError });

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, address, contact_info, is_active, avatar_path")
    .eq("id", "c1a00000-0001-4000-8001-000000000001")
    .maybeSingle();

  console.log("Client query result:", { client, clientError });
}

main().catch(console.error);
