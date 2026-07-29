import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { getAuthenticatedSession } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type HomePageProps = Readonly<{
  params: Promise<{
    locale: Locale;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const session = await getAuthenticatedSession(locale);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  redirect(
    session.profile.role === "admin"
      ? `/${locale}/admin`
      : `/${locale}/employee`,
  );
}
