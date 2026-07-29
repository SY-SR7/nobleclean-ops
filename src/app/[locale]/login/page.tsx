import { AuthShell } from "@/features/auth/AuthShell";
import { LoginForm } from "@/features/auth/LoginForm";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

type LoginPageProps = Readonly<{
  params: Promise<{
    locale: Locale;
  }>;
  searchParams: Promise<{
    next?: string | string[];
  }>;
}>;

function readNextPath(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return "";
  }

  return value;
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  const { next } = await searchParams;
  const messages = getMessages(locale);

  return (
    <AuthShell
      appName={t(messages, "foundation.appName")}
      body={t(messages, "auth.login.support")}
      headingId="login-heading"
      logoAlt={t(messages, "foundation.appName")}
      title={t(messages, "auth.login.title")}
    >
      <LoginForm
        copy={{
          emailLabel: t(messages, "auth.login.email"),
          genericError: t(messages, "auth.login.genericError"),
          passwordLabel: t(messages, "auth.login.password"),
          submitLabel: t(messages, "auth.login.submit"),
        }}
        locale={locale}
        nextPath={readNextPath(next)}
      />
    </AuthShell>
  );
}
