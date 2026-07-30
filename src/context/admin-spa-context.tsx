"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export type AdminTab = "home" | "clients" | "staff" | "sections" | "schedule" | "reports";

const validTabs: readonly AdminTab[] = ["home", "clients", "staff", "sections", "schedule", "reports"];

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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlTab = searchParams.get("tab") as AdminTab | null;
  const urlClientId = searchParams.get("clientId");
  const urlSectionId = searchParams.get("sectionId");

  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    return urlTab && validTabs.includes(urlTab) ? urlTab : "home";
  });

  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(() => urlClientId);
  const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(() => urlSectionId);

  // Sync state if URL changes externally
  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
    if (urlClientId !== undefined && urlClientId !== selectedClientId) {
      setSelectedClientIdState(urlClientId);
    }
    if (urlSectionId !== undefined && urlSectionId !== selectedSectionId) {
      setSelectedSectionIdState(urlSectionId);
    }
  }, [urlTab, urlClientId, urlSectionId]);

  const setSelectedClientId = useCallback((id: string | null) => {
    setSelectedClientIdState(id);
  }, []);

  const setSelectedSectionId = useCallback((id: string | null) => {
    setSelectedSectionIdState(id);
  }, []);

  const setActiveTab = useCallback(
    (tab: AdminTab, clientId?: string, sectionId?: string) => {
      setActiveTabState(tab);
      let newClientId = selectedClientId;
      let newSectionId = selectedSectionId;

      if (clientId !== undefined) {
        setSelectedClientIdState(clientId);
        newClientId = clientId;
      }
      if (sectionId !== undefined) {
        setSelectedSectionIdState(sectionId);
        newSectionId = sectionId;
      }

      // Smooth URL update without triggering full page reload
      try {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", tab);
        if (newClientId) params.set("clientId", newClientId);
        else params.delete("clientId");
        if (newSectionId) params.set("sectionId", newSectionId);
        else params.delete("sectionId");

        const newUrl = `${pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      } catch {
        // Fallback for non-browser environments
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pathname, selectedClientId, selectedSectionId],
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
