"use client";

import { Building2 } from "lucide-react";
import { useAdminSpa } from "@/context/admin-spa-context";

type ClientOption = Readonly<{
  id: string;
  name: string;
  isActive: boolean;
}>;

type SmartClientSelectorProps = Readonly<{
  clients: readonly ClientOption[];
  selectedClientId: string;
  clientLabel: string;
  inactiveLabel: string;
}>;

export function SmartClientSelector({
  clients,
  selectedClientId,
  clientLabel,
  inactiveLabel,
}: SmartClientSelectorProps) {
  const { setActiveTab } = useAdminSpa();

  const handleSelect = (clientId: string) => {
    setActiveTab("sections", clientId, "");
  };

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/60">
      {/* Dropdown & Label */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
          <Building2 className="size-5" />
        </div>
        <div className="flex-1 sm:min-w-80">
          <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
            {clientLabel} (Sofort-Auswahl)
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none transition cursor-pointer"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.isActive ? "" : `(${inactiveLabel})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <span className="text-xs font-bold text-on-surface-variant hidden sm:inline-block">
        Automatische Kunden-Aktualisierung
      </span>
    </div>
  );
}
