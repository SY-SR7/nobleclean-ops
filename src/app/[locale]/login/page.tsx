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
    <main className="bg-surface flex min-h-screen items-center justify-center px-4 py-10">
      <section className="border-outline-variant bg-surface-container-lowest shadow-level-1 w-full max-w-sm rounded-lg border p-6">
        <div className="mb-6">
          <p className="text-secondary text-xs font-bold tracking-normal uppercase">
            {t(messages, "foundation.appName")}
          </p>
          <h1 className="font-heading text-primary-container mt-2 text-2xl font-bold">
            {t(messages, "auth.login.title")}
          </h1>
        </div>

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
      </section>
    </main>
  );
}
