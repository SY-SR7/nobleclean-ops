"use client";

import type { ReactNode } from "react";
import { useAdminSpa, type AdminTab } from "@/context/admin-spa-context";

type AdminSpaContainerProps = Readonly<{
  labels: Record<string, string>;
  homeTab: ReactNode;
  clientsTab: ReactNode;
  staffTab: ReactNode;
  sectionsTab: ReactNode;
  scheduleTab: ReactNode;
  reportsTab: ReactNode;
}>;

export function AdminSpaContainer({
  labels,
  homeTab,
  clientsTab,
  staffTab,
  sectionsTab,
  scheduleTab,
  reportsTab,
}: AdminSpaContainerProps) {
  const { activeTab, setActiveTab } = useAdminSpa();

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "home", label: labels.home },
    { id: "clients", label: labels.clients },
    { id: "staff", label: labels.staff },
    { id: "sections", label: labels.sections },
    { id: "schedule", label: labels.schedule },
    { id: "reports", label: labels.reports },
  ];

  return (
    <div>
      {/* Top Tab Bar — Single Page App style, zero reload, zero URL change */}
      <div className="border-outline-variant -mx-mobile-margin lg:-mx-desktop-margin -mt-6 lg:-mt-8 mb-6 overflow-x-auto border-b lg:mb-8">
        <div className="px-mobile-margin lg:px-desktop-margin flex min-w-max gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px cursor-pointer select-none",
                  isActive
                    ? "border-secondary text-secondary font-bold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render active tab content instantly */}
      <div>
        {activeTab === "home" && homeTab}
        {activeTab === "clients" && clientsTab}
        {activeTab === "staff" && staffTab}
        {activeTab === "sections" && sectionsTab}
        {activeTab === "schedule" && scheduleTab}
        {activeTab === "reports" && reportsTab}
      </div>
    </div>
  );
}
