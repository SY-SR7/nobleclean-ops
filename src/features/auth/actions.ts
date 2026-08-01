"use server";

import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/routing";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { safeLocalizedRedirectPath } from "@/lib/security/redirects";
import { pickFormData } from "@/lib/validation/form-data";
import {
  initialLoginActionState,
  LoginInputSchema,
  LogoutInputSchema,
  type LoginActionState,
} from "./schema";

export async function loginAction(
  _previousState: LoginActionState = initialLoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void _previousState;

  let raw;

  try {
    raw = pickFormData(formData, ["email", "password", "locale", "next"]);
  } catch {
    return { errorCode: "VALIDATION_FAILED" };
  }

  const parsed = LoginInputSchema.safeParse(raw);

  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return { errorCode: "VALIDATION_FAILED" };
  }

  if (!(await hasSameOriginRequest())) {
    return { errorCode: "AUTH_FAILED" };
  }

  const { email, password, locale, next } = parsed.data;
  const isWithinRateLimit = await checkRequestRateLimit({
    keyParts: [email.toLowerCase()],
    limit: 5,
    scope: "auth.login",
    windowMs: 5 * 60 * 1000,
  });

  if (!isWithinRateLimit) {
    return { errorCode: "AUTH_FAILED" };
  }

  const nextPath = safeLocalizedRedirectPath(next, locale);

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { errorCode: "AUTH_FAILED" };
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { errorCode: "AUTH_FAILED" };
  }

  // Self-heal: ensure user has a matching profile row in public.profiles
  if (authData?.user) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!existingProfile) {
      const userRole =
        email.trim().toLowerCase() === "nobleclean.private@gmail.com"
          ? "admin"
          : "employee";

      await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name:
          (authData.user.user_metadata?.full_name as string | undefined) ||
          email.split("@")[0] ||
          "NobleClean User",
        role: userRole,
      });
    }
  }

  redirect(nextPath);
}

export async function logoutAction(formData: FormData): Promise<never> {
  let raw;

  try {
    raw = pickFormData(formData, ["locale"]);
  } catch {
    raw = { locale: "de" };
  }

  const parsed = LogoutInputSchema.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : "de";

  try {
    if (!(await hasSameOriginRequest())) {
      redirect(`/${locale}/login`);
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // The redirect remains generic; callers do not need auth internals.
  }

  redirect(`/${locale}/login`);
}
