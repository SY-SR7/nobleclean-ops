import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "employee";

export type AuthenticatedProfile = Readonly<{
  id: string;
  fullName: string;
  role: AppRole;
}>;

export type AuthenticatedSession = Readonly<{
  profile: AuthenticatedProfile;
}>;

type AuthLoadResult =
  | Readonly<{
      status: "authenticated";
      session: AuthenticatedSession;
    }>
  | Readonly<{
      status: "mfa_required" | "profile_missing" | "unauthenticated";
    }>;

const UserClaimsSchema = z
  .object({
    sub: z.string().uuid(),
  })
  .passthrough();

const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  role: z.enum(["admin", "employee"]),
});

const AssignedClientSchema = z.object({
  client_id: z.string().uuid(),
});

function loginPath(locale: Locale): string {
  return `/${locale}/login`;
}

function mfaPath(locale: Locale): string {
  return `/${locale}/auth/mfa`;
}

async function createGuardClient(locale: Locale) {
  try {
    return await createSupabaseServerClient();
  } catch {
    redirect(loginPath(locale));
  }
}

async function loadAuthenticatedSession(
  locale: Locale,
): Promise<AuthLoadResult> {
  const supabase = await createGuardClient(locale);
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData) {
    return { status: "unauthenticated" };
  }

  const claims = UserClaimsSchema.safeParse(claimsData.claims);

  if (!claims.success) {
    return { status: "unauthenticated" };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    assuranceError ||
    !assurance ||
    assurance.currentLevel !== "aal2" ||
    assurance.nextLevel !== "aal2"
  ) {
    return { status: "mfa_required" };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", claims.data.sub)
    .single();

  if (profileError) {
    return { status: "profile_missing" };
  }

  const profile = ProfileSchema.safeParse(profileRow);

  if (!profile.success) {
    return { status: "profile_missing" };
  }

  return {
    session: {
      profile: {
        fullName: profile.data.full_name,
        id: profile.data.id,
        role: profile.data.role,
      },
    },
    status: "authenticated",
  };
}

export async function getAuthenticatedSession(
  locale: Locale,
): Promise<AuthenticatedSession | null> {
  const result = await loadAuthenticatedSession(locale);
  return result.status === "authenticated" ? result.session : null;
}

export async function requireAuthenticatedSession(
  locale: Locale,
): Promise<AuthenticatedSession> {
  const result = await loadAuthenticatedSession(locale);

  switch (result.status) {
    case "authenticated":
      return result.session;
    case "mfa_required":
      redirect(mfaPath(locale));
      throw new Error("Unexpected MFA redirect continuation.");
    case "profile_missing":
      notFound();
      throw new Error("Unexpected notFound continuation.");
    case "unauthenticated":
      redirect(loginPath(locale));
      throw new Error("Unexpected login redirect continuation.");
  }
}

export async function requireRole(
  locale: Locale,
  role: AppRole,
): Promise<AuthenticatedSession> {
  const session = await requireAuthenticatedSession(locale);

  if (session.profile.role !== role) {
    notFound();
  }

  return session;
}

export async function requireAssignedClient(
  locale: Locale,
  clientId: string,
): Promise<AuthenticatedSession> {
  const session = await requireRole(locale, "employee");
  const parsedClientId = z.string().uuid().safeParse(clientId);

  if (!parsedClientId.success) {
    notFound();
  }

  const supabase = await createGuardClient(locale);
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("employee_client_assignments")
    .select("client_id")
    .eq("employee_id", session.profile.id)
    .eq("client_id", parsedClientId.data)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .maybeSingle();

  if (error) {
    notFound();
  }

  const assignment = AssignedClientSchema.safeParse(data);

  if (!assignment.success) {
    notFound();
  }

  return session;
}
