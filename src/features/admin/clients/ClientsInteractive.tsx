"use client";

import { Building2, MapPin, Phone, Mail, User, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { Button, PriorityStatusBadge } from "@/components/ui";
import type { AdminClientListItem } from "./queries";
import type { Locale } from "@/i18n/routing";

type ClientsInteractiveProps = Readonly<{
  clients: readonly AdminClientListItem[];
  locale: Locale;
  copy: {
    active: string;
    inactive: string;
    address: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contactNotes: string;
    updatedAt: string;
    notAvailable: string;
    viewSections: string;
    viewSchedule: string;
  };
}>;

function formatDate(value: string | null, locale: Locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="text-secondary mt-0.5 shrink-0">{icon}</div>}
      <div>
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-on-surface text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function ClientsInteractive({ clients, locale, copy }: ClientsInteractiveProps) {
  const { open } = useDetailDrawer();

  const openClientDrawer = useCallback(
    (client: AdminClientListItem) => {
      const updatedAt = formatDate(client.updatedAt, locale);
      const drawerConfig: DrawerConfig = {
        title: client.name,
        subtitle: client.address || copy.notAvailable,
        icon: <Building2 className="size-5" />,
        accentColor: client.isActive ? "secondary" : "warning",
        sections: [
          {
            label: "Status",
            content: (
              <span
                className={
                  client.isActive
                    ? "bg-secondary-container text-on-secondary-container inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                    : "bg-surface-container text-on-surface-variant inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                }
              >
                {client.isActive ? copy.active : copy.inactive}
              </span>
            ),
          },
          {
            label: "Kontaktdaten",
            content: (
              <div className="grid gap-3">
                <InfoRow icon={<MapPin className="size-4" />} label={copy.address} value={client.address || copy.notAvailable} />
                <InfoRow icon={<User className="size-4" />} label={copy.contactName} value={client.contactInfo.contactName || copy.notAvailable} />
                <InfoRow icon={<Mail className="size-4" />} label={copy.contactEmail} value={client.contactInfo.email || copy.notAvailable} />
                <InfoRow icon={<Phone className="size-4" />} label={copy.contactPhone} value={client.contactInfo.phone || copy.notAvailable} />
                {client.contactInfo.notes && (
                  <InfoRow icon={<FileText className="size-4" />} label={copy.contactNotes} value={client.contactInfo.notes} />
                )}
                {updatedAt && (
                  <InfoRow label={copy.updatedAt} value={updatedAt} />
                )}
              </div>
            ),
          },
        ],
        footer: (
          <div className="grid gap-2">
            <Link
              className="bg-secondary text-on-secondary flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              href={`/${locale}/admin?tab=sections&clientId=${client.id}`}
            >
              <span>{copy.viewSections}</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="border-outline-variant hover:bg-surface-container flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
              href={`/${locale}/admin?tab=schedule`}
            >
              <span>{copy.viewSchedule}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ),
      };
      open(drawerConfig);
    },
    [open, locale, copy],
  );

  return (
    <div className="grid gap-3">
      {clients.map((client) => (
        <article
          key={client.id}
          className="border-outline-variant bg-surface-container-lowest group cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:border-secondary hover:shadow-md"
          onClick={() => openClientDrawer(client)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openClientDrawer(client)}
          aria-label={`${client.name} – Details anzeigen`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-on-surface group-hover:text-secondary text-base font-bold transition-colors truncate">
                  {client.name}
                </h3>
                <span
                  className={
                    client.isActive
                      ? "bg-secondary-container text-on-secondary-container inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                      : "bg-surface-container text-on-surface-variant inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                  }
                >
                  {client.isActive ? copy.active : copy.inactive}
                </span>
              </div>
              {client.address && (
                <p className="text-on-surface-variant mt-1 text-sm flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {client.address}
                </p>
              )}
              {client.contactInfo.email && (
                <p className="text-on-surface-variant mt-0.5 text-xs flex items-center gap-1.5">
                  <Mail className="size-3 shrink-0" />
                  {client.contactInfo.email}
                </p>
              )}
            </div>
            <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-5 shrink-0 transition-colors" />
          </div>
        </article>
      ))}
    </div>
  );
}
