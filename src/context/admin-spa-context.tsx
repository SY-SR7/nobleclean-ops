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
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(null);

  const setSelectedClientId = useCallback((id: string | null) => {
    setSelectedClientIdState(id);
  }, []);

  const setSelectedSectionId = useCallback((id: string | null) => {
    setSelectedSectionIdState(id);
  }, []);

  const setActiveTab = useCallback(
    (tab: AdminTab, clientId?: string, sectionId?: string) => {
      setActiveTabState(tab);
      if (clientId !== undefined) {
        setSelectedClientIdState(clientId);
      }
      if (sectionId !== undefined) {
        setSelectedSectionIdState(sectionId);
      }
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
