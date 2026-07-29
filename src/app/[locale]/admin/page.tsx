import { notFound } from "next/navigation";

import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

type AdminPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);

  return (
    <section>
      <h1 className="font-heading text-primary-container text-2xl font-bold">
        {t(messages, "navigation.admin.home")}
      </h1>
    </section>
  );
}
