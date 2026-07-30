"use client";

import { Building2, MapPin, Phone, Mail, User, FileText, ArrowRight, LayoutGrid, List } from "lucide-react";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { ClientForm, ClientStatusForm } from "./ClientForm";
import { useAdminSpa } from "@/context/admin-spa-context";
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

function ClientAvatar({ name, isActive }: { name: string; isActive: boolean }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={[
        "flex items-center justify-center rounded-2xl font-bold text-lg transition-transform group-hover:scale-105",
        isActive
          ? "bg-secondary text-on-secondary"
          : "bg-surface-container text-on-surface-variant",
      ].join(" ")}
    >
      {initials}
    </div>
  );
}

export function ClientsInteractive({ clients, locale, copy }: ClientsInteractiveProps) {
  const { open, close } = useDetailDrawer();
  const { setActiveTab } = useAdminSpa();
  const [viewMode, setViewMode] = useViewMode("clients", "grid");

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
          {
            label: "Kunde bearbeiten",
            content: (
              <ClientForm
                client={{
                  id: client.id,
                  name: client.name,
                  address: client.address,
                  contactInfo: client.contactInfo,
                }}
                copy={{
                  addressLabel: "Adresse",
                  contactEmailLabel: "E-Mail",
                  contactNameLabel: "Ansprechpartner",
                  contactNotesLabel: "Notizen",
                  contactPhoneLabel: "Telefon",
                  createSubmit: "Kunde anlegen",
                  createTitle: "Neuen Kunden anlegen",
                  errorMessage: "Fehler beim Speichern",
                  fieldError: "Ungültiges Feld",
                  nameLabel: "Firmenname",
                  successCreated: "Kunde angelegt",
                  successUpdated: "Kunde aktualisiert",
                  updateSubmit: "Änderungen speichern",
                  updateTitle: "Kunde bearbeiten",
                }}
                formIdPrefix={`modal-edit-${client.id}`}
                locale={locale}
                mode="update"
              />
            ),
          },
          {
            label: "Status ändern",
            content: (
              <ClientStatusForm
                clientId={client.id}
                copy={{
                  deactivate: "Kunde deaktivieren",
                  errorMessage: "Fehler beim Statuswechsel",
                  reactivate: "Kunde reaktivieren",
                  success: "Status geändert",
                }}
                isActive={client.isActive}
                locale={locale}
              />
            ),
          },
        ],
        footer: (
          <div className="grid gap-2">
            <button
              type="button"
              className="bg-secondary text-on-secondary flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 w-full cursor-pointer"
              onClick={() => {
                close();
                setActiveTab("sections", client.id);
              }}
            >
              <span>{copy.viewSections}</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              className="border-outline-variant hover:bg-surface-container flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors w-full cursor-pointer"
              onClick={() => {
                close();
                setActiveTab("schedule");
              }}
            >
              <span>{copy.viewSchedule}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        ),
      };
      open(drawerConfig);
    },
    [open, close, locale, copy, setActiveTab],
  );

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {clients.length} {clients.length === 1 ? "Kunde" : "Kunden"}
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest text-left shadow-sm transition-all hover:border-secondary hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              onClick={() => openClientDrawer(client)}
              aria-label={`${client.name} – Details anzeigen`}
            >
              {/* Card top: avatar area */}
              <div className="flex items-center justify-center bg-surface-container px-4 pt-6 pb-4">
                <div className="h-16 w-16">
                  <ClientAvatar name={client.name} isActive={client.isActive} />
                </div>
              </div>
              {/* Card body */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-on-surface group-hover:text-secondary text-base font-bold transition-colors leading-tight line-clamp-2">
                    {client.name}
                  </h3>
                  <span
                    className={
                      client.isActive
                        ? "shrink-0 bg-secondary-container text-on-secondary-container inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                        : "shrink-0 bg-surface-container text-on-surface-variant inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                    }
                  >
                    {client.isActive ? copy.active : copy.inactive}
                  </span>
                </div>
                {client.address && (
                  <p className="text-on-surface-variant text-xs flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </p>
                )}
                {client.contactInfo.email && (
                  <p className="text-on-surface-variant text-xs flex items-center gap-1.5">
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">{client.contactInfo.email}</span>
                  </p>
                )}
              </div>
              {/* Bottom accent line */}
              <div className={["h-1 w-full transition-all", client.isActive ? "bg-secondary" : "bg-surface-container"].join(" ")} />
            </button>
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="grid gap-2">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className="group flex w-full items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left shadow-sm transition-all hover:border-secondary hover:shadow-md cursor-pointer"
              onClick={() => openClientDrawer(client)}
              aria-label={`${client.name} – Details anzeigen`}
            >
              <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm bg-secondary text-on-secondary">
                {client.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-on-surface group-hover:text-secondary font-semibold text-sm transition-colors truncate">
                  {client.name}
                </p>
                {client.address && (
                  <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 shrink-0" />{client.address}
                  </p>
                )}
              </div>
              <span
                className={
                  client.isActive
                    ? "shrink-0 bg-secondary-container text-on-secondary-container inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                    : "shrink-0 bg-surface-container text-on-surface-variant inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                }
              >
                {client.isActive ? copy.active : copy.inactive}
              </span>
              <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
