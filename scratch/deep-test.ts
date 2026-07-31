import { createClient } from "@supabase/supabase-js";

const url = "http://127.0.0.1:54321";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function main() {
  // 1. Login as nobleclean.private@gmail.com
  const anonClient = createClient(url, anonKey);
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: "nobleclean.private@gmail.com",
    password: "NobleClean2026!",
  });
  console.log("=== LOGIN RESULT ===");
  console.log("User:", authData?.user?.email, "| Error:", authError?.message);

  if (!authData?.session?.access_token) {
    console.error("No session token, cannot test further");
    return;
  }

  const jwt = authData.session.access_token;
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
  console.log("\n=== JWT PAYLOAD ===");
  console.log("sub:", payload.sub);
  console.log("role:", payload.role);
  console.log("aal:", payload.aal ?? "(not set)");
  console.log("iss:", payload.iss);

  // 2. Use user session to query clients table (with RLS)
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  console.log("\n=== CLIENT QUERY (with user JWT) ===");
  const { data: client, error: clientError } = await userClient
    .from("clients")
    .select("id, name, address")
    .eq("id", "c1a00000-0001-4000-8001-000000000001")
    .maybeSingle();
  console.log("Client:", JSON.stringify(client));
  console.log("Error:", clientError?.message ?? "none");

  // 3. Test current_user_is_admin via RPC with user token
  console.log("\n=== current_user_is_admin() with user JWT ===");
  const { data: isAdminData, error: isAdminError } = await userClient.rpc("current_user_is_admin");
  console.log("is_admin:", isAdminData, "| Error:", isAdminError?.message ?? "none");

  // 4. profile query
  console.log("\n=== PROFILE QUERY (with user JWT) ===");
  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", authData.user!.id)
    .single();
  console.log("Profile:", JSON.stringify(profile));
  console.log("Error:", profileError?.message ?? "none");
}

main().catch(console.error);
