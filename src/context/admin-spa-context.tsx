"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type AdminTab = "home" | "clients" | "staff" | "sections" | "schedule" | "reports" | "audit";

const TAB_MAP: Record<string, AdminTab> = {
  home: "home",
  clients: "clients",
  staff: "staff",
  sections: "sections",
  schedule: "schedule",
  reports: "reports",
  audit: "audit",
};

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
  const router = useRouter();

  // Read initial tab from URL query params ?tab=...
  const tabFromUrl = searchParams ? searchParams.get("tab") : null;
  const initialTab: AdminTab = (tabFromUrl && TAB_MAP[tabFromUrl]) || "home";

  const [activeTab, setActiveTabState] = useState<AdminTab>(initialTab);
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(
    searchParams ? searchParams.get("clientId") : null
  );
  const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(
    searchParams ? searchParams.get("sectionId") : null
  );

  // Sync state automatically if searchParams in URL change
  useEffect(() => {
    if (!searchParams) return;
    const currentTabParam = searchParams.get("tab");
    const targetTab = (currentTabParam && TAB_MAP[currentTabParam]) || "home";

    if (targetTab !== activeTab) {
      setActiveTabState(targetTab);
    }
  }, [searchParams, activeTab]);

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

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const parts = currentPath.split("/").filter(Boolean);
        // parts[0] is locale (e.g. 'de' or 'en'), parts[1] is 'admin'
        const localeStr = parts[0] || "de";
        const isSubPage = parts.length > 2; // e.g. /de/admin/staff/123 or /de/admin/clients/456

        const search = new URLSearchParams();
        search.set("tab", tab);
        if (clientId) search.set("clientId", clientId);
        if (sectionId) search.set("sectionId", sectionId);

        const targetHref = `/${localeStr}/admin?${search.toString()}`;

        if (isSubPage) {
          // If we are currently inside a detail sub-page, navigate back to main SPA admin route!
          router.push(targetHref);
        } else {
          // Soft URL sync on main admin SPA page
          window.history.pushState(null, "", targetHref);
          window.dispatchEvent(new CustomEvent("nc-tab-change", { detail: { tab } }));
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
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
