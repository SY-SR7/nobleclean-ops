import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/auth/guards";

import { parseClientContactInfo, type ClientContactInfo } from "./schema";

export type AdminClientListItem = Readonly<{
  address: string;
  contactInfo: ClientContactInfo;
  id: string;
  isActive: boolean;
  name: string;
  updatedAt: string | null;
}>;

export type AdminClientsResult =
  | Readonly<{
      clients: readonly AdminClientListItem[];
      ok: true;
    }>
  | Readonly<{
      clients: readonly [];
      ok: false;
    }>;

const ClientRowSchema = z.object({
  address: z.string(),
  contact_info: z.unknown(),
  id: z.string().uuid(),
  is_active: z.boolean(),
  name: z.string(),
  updated_at: z.string().nullable(),
});

function toClientListItem(row: z.infer<typeof ClientRowSchema>) {
  return {
    address: row.address,
    contactInfo: parseClientContactInfo(row.contact_info),
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    updatedAt: row.updated_at,
  } satisfies AdminClientListItem;
}

function matchesQuery(client: AdminClientListItem, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    client.name,
    client.address,
    client.contactInfo.contactName,
    client.contactInfo.email,
    client.contactInfo.phone,
    client.contactInfo.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export async function listAdminClients(
  locale: Locale,
  query: string,
): Promise<AdminClientsResult> {
  await requireRole(locale, "admin");

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, address, contact_info, is_active, updated_at")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      return { clients: [], ok: false };
    }

    const rows = z.array(ClientRowSchema).safeParse(data);

    if (!rows.success) {
      return { clients: [], ok: false };
    }

    return {
      clients: rows.data
        .map(toClientListItem)
        .filter((client) => matchesQuery(client, query)),
      ok: true,
    };
  } catch {
    return { clients: [], ok: false };
  }
}
