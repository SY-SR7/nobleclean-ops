"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "@/features/auth/actions";
import type { Locale } from "@/i18n/routing";

type LoginFormCopy = Readonly<{
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  genericError: string;
}>;

type LoginFormProps = Readonly<{
  copy: LoginFormCopy;
  locale: Locale;
  nextPath: string;
}>;

const initialState: LoginActionState = {
  errorCode: null,
};

export function LoginForm({ copy, locale, nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input name="locale" type="hidden" value={locale} />
      <input name="next" type="hidden" value={nextPath} />

      <div className="grid gap-2">
        <label
          className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
          htmlFor="email"
        >
          {copy.emailLabel}
        </label>
        <input
          autoComplete="email"
          className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
          id="email"
          inputMode="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label
          className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
          htmlFor="password"
        >
          {copy.passwordLabel}
        </label>
        <input
          autoComplete="current-password"
          className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
          id="password"
          maxLength={1024}
          name="password"
          required
          type="password"
        />
      </div>

      {state.errorCode ? (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.genericError}
        </p>
      ) : null}

      <button
        className="bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container h-12 rounded px-4 text-sm font-bold tracking-normal uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {copy.submitLabel}
      </button>
    </form>
  );
}
