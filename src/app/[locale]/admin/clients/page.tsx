import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/routing";

type PageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function AdminClientsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    redirect("/de/admin");
  }
  redirect(`/${locale}/admin`);
}
