"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale, type Locale } from "@/i18n/routing";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { pickFormData } from "@/lib/validation/form-data";

export type LoginActionState = Readonly<{
  errorCode: "AUTH_FAILED" | "VALIDATION_FAILED" | null;
}>;

const initialState: LoginActionState = {
  errorCode: null,
};

const LoginInputSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
    locale: z.enum(["de", "en"]),
    next: z.string().max(2048).optional(),
  })
  .strict();

const LogoutInputSchema = z
  .object({
    locale: z.enum(["de", "en"]),
  })
  .strict();

function safeNextPath(value: string | undefined, locale: Locale): string {
  const fallback = `/${locale}`;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const parsed = new URL(value, "https://nobleclean.local");

  const localeRoot = `/${locale}`;
  const isLocalePath =
    parsed.pathname === localeRoot ||
    parsed.pathname.startsWith(`${localeRoot}/`);

  if (parsed.origin !== "https://nobleclean.local" || !isLocalePath) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export async function loginAction(
  _previousState: LoginActionState = initialState,
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

  const nextPath = safeNextPath(next, locale);

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { errorCode: "AUTH_FAILED" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { errorCode: "AUTH_FAILED" };
  }

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    !assurance ||
    assurance.currentLevel !== "aal2" ||
    assurance.nextLevel !== "aal2"
  ) {
    redirect(`/${locale}/auth/mfa?next=${encodeURIComponent(nextPath)}`);
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
