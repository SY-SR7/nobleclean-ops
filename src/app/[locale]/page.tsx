import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

type HomePageProps = Readonly<{
  params: Promise<{
    locale: Locale;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);

  return (
    <main className="min-h-screen px-4 py-8">
      <h1 className="sr-only">{t(messages, "foundation.appName")}</h1>
    </main>
  );
}
