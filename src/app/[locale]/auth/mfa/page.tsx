import { Button } from "@/components/ui";
import { AuthShell } from "@/features/auth/AuthShell";
import { logoutAction } from "@/features/auth/actions";
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
    <AuthShell
      appName={t(messages, "foundation.appName")}
      body={t(messages, "auth.mfa.body")}
      cardClassName="max-w-md"
      headingId="mfa-heading"
      logoAlt={t(messages, "foundation.appName")}
      title={t(messages, "auth.mfa.title")}
    >
      <form action={logoutAction} className="mt-6">
        <input name="locale" type="hidden" value={locale} />
        <Button className="w-full" type="submit" variant="secondary">
          {t(messages, "auth.logout.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
