"use client";

import { useActionState } from "react";

import { Button, FormInput } from "@/components/ui";
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
  const hasError = Boolean(state.errorCode);
  const errorId = "login-error";
  const inputDescribedBy = hasError ? errorId : undefined;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input name="locale" type="hidden" value={locale} />
      <input name="next" type="hidden" value={nextPath} />

      <FormInput
        aria-describedby={inputDescribedBy}
        aria-invalid={hasError || undefined}
        autoComplete="email"
        id="email"
        inputMode="email"
        label={copy.emailLabel}
        maxLength={254}
        name="email"
        required
        type="email"
      />

      <FormInput
        aria-describedby={inputDescribedBy}
        aria-invalid={hasError || undefined}
        autoComplete="current-password"
        id="password"
        label={copy.passwordLabel}
        maxLength={1024}
        name="password"
        required
        type="password"
      />

      {hasError ? (
        <p
          aria-live="polite"
          className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm"
          id={errorId}
          role="alert"
        >
          {copy.genericError}
        </p>
      ) : null}

      <Button className="w-full" isLoading={isPending} type="submit">
        {copy.submitLabel}
      </Button>
    </form>
  );
}
