"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type AdminTab = "home" | "clients" | "staff" | "sections" | "schedule" | "reports";

type AdminSpaContextValue = Readonly<{
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab, clientId?: string, sectionId?: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
}>;

const AdminSpaContext = createContext<AdminSpaContextValue | null>(null);

export function useAdminSpa() {
  const ctx = useContext(AdminSpaContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      activeTab: "home" as AdminTab,
      setActiveTab: () => {},
      selectedClientId: null,
      setSelectedClientId: () => {},
      selectedSectionId: null,
      setSelectedSectionId: () => {},
    };
  }
  return ctx;
}

export function AdminSpaProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<AdminTab>("home");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const setActiveTab = useCallback(
    (tab: AdminTab, clientId?: string, sectionId?: string) => {
      setActiveTabState(tab);
      if (clientId !== undefined) {
        setSelectedClientId(clientId);
      }
      if (sectionId !== undefined) {
        setSelectedSectionId(sectionId);
      }
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  return (
    <AdminSpaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedClientId,
        setSelectedClientId,
        selectedSectionId,
        setSelectedSectionId,
      }}
    >
      {children}
    </AdminSpaContext.Provider>
  );
}
