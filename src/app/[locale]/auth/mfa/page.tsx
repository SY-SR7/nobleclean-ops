import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

type MfaPageProps = Readonly<{
  params: Promise<{
    locale: Locale;
  }>;
}>;

export default async function MfaPage({ params }: MfaPageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);

  return (
    <main className="bg-surface flex min-h-screen items-center justify-center px-4 py-10">
      <section className="border-outline-variant bg-surface-container-lowest shadow-level-1 w-full max-w-md rounded-lg border p-6">
        <p className="text-secondary text-xs font-bold tracking-normal uppercase">
          {t(messages, "foundation.appName")}
        </p>
        <h1 className="font-heading text-primary-container mt-2 text-2xl font-bold">
          {t(messages, "auth.mfa.title")}
        </h1>
        <p className="text-on-surface-variant mt-3 text-sm leading-6">
          {t(messages, "auth.mfa.body")}
        </p>
      </section>
    </main>
  );
}
