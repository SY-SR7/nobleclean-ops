"use client";

import { Building2, MapPin, Phone, Mail, User, FileText, ArrowRight } from "lucide-react";
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

/** Generates a consistent gradient color based on name */
function getClientGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-indigo-700",
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-700",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-violet-700",
    "from-lime-500 to-green-700",
  ];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function ClientsInteractive({ clients, locale, copy }: ClientsInteractiveProps) {
  const { open, close } = useDetailDrawer();
  const { setActiveTab } = useAdminSpa();
  const [viewMode, setViewMode] = useViewMode("clients", "grid");

  const openClientDrawer = useCallback(
    (client: AdminClientListItem) => {
      const drawerConfig: DrawerConfig = {
        title: client.name,
        subtitle: client.address || copy.notAvailable,
        icon: <Building2 className="size-6" />,
        accentColor: client.isActive ? "secondary" : "warning",
        badge: {
          label: client.isActive ? copy.active : copy.inactive,
          variant: client.isActive ? "success" : "neutral",
        },
        kpis: [
          { label: "Status", value: client.isActive ? "Aktiv" : "Inaktiv", color: client.isActive ? "text-emerald-600" : "text-gray-400" },
          { label: "Kontakt", value: client.contactInfo.contactName || "—", color: "text-blue-600" },
          { label: "Telefon", value: client.contactInfo.phone || "—", color: "text-violet-600" },
        ],
        sections: [
          {
            label: "Kontaktdaten (Direkt im Feld editierbar)",
            content: (
              <ClientForm
                client={{ id: client.id, name: client.name, address: client.address, contactInfo: client.contactInfo }}
                copy={{
                  addressLabel: "Adresse", contactEmailLabel: "E-Mail", contactNameLabel: "Ansprechpartner",
                  contactNotesLabel: "Notizen", contactPhoneLabel: "Telefon", createSubmit: "Kunde anlegen",
                  createTitle: "Neuen Kunden anlegen", errorMessage: "Fehler beim Speichern",
                  fieldError: "Ungültiges Feld", nameLabel: "Firmenname", successCreated: "Kunde angelegt",
                  successUpdated: "Kunde aktualisiert", updateSubmit: "Änderungen speichern", updateTitle: "Kunde bearbeiten",
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
                copy={{ deactivate: "Kunde deaktivieren", errorMessage: "Fehler beim Statuswechsel", reactivate: "Kunde reaktivieren", success: "Status geändert" }}
                isActive={client.isActive}
                locale={locale}
              />
            ),
          },
        ],
        footer: (
          <div className="grid gap-2">
            <button type="button" className="bg-secondary text-on-secondary flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 w-full cursor-pointer shadow-sm" onClick={() => { close(); setActiveTab("sections", client.id); }}>
              <span>{copy.viewSections}</span>
              <ArrowRight className="size-4" />
            </button>
            <button type="button" className="border-outline-variant hover:bg-surface-container flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors w-full cursor-pointer" onClick={() => { close(); setActiveTab("schedule"); }}>
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
          {clients.map((client) => {
            const gradient = getClientGradient(client.name);
            const initials = client.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={client.id}
                type="button"
                className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest text-left shadow-sm transition-all hover:border-secondary hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                onClick={() => openClientDrawer(client)}
              >
                {/* Gradient header with initials */}
                <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-4 py-8`}>
                  <span className="text-white font-bold text-3xl drop-shadow-md">{initials}</span>
                  {/* Status dot */}
                  <span className={["absolute top-3 right-3 h-2.5 w-2.5 rounded-full border-2 border-white shadow", client.isActive ? "bg-green-400" : "bg-gray-400"].join(" ")} />
                </div>
                {/* Card body */}
                <div className="flex flex-col gap-2 p-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-on-surface group-hover:text-secondary text-base font-bold transition-colors leading-tight line-clamp-2">
                      {client.name}
                    </h3>
                    <span className={
                      client.isActive
                        ? "shrink-0 bg-secondary-container text-on-secondary-container inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        : "shrink-0 bg-surface-container text-on-surface-variant inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    }>
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
              </button>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="grid gap-2">
          {clients.map((client) => {
            const gradient = getClientGradient(client.name);
            const initials = client.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={client.id}
                type="button"
                className="group flex w-full items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left shadow-sm transition-all hover:border-secondary hover:shadow-md cursor-pointer"
                onClick={() => openClientDrawer(client)}
              >
                <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br ${gradient}`}>
                  {initials}
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
                <span className={
                  client.isActive
                    ? "shrink-0 bg-secondary-container text-on-secondary-container inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                    : "shrink-0 bg-surface-container text-on-surface-variant inline-flex rounded-full px-2 py-0.5 text-xs font-bold"
                }>
                  {client.isActive ? copy.active : copy.inactive}
                </span>
                <ArrowRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
