"use client";

import type { ReactNode } from "react";
import { useAdminSpa } from "@/context/admin-spa-context";

type AdminSpaContainerProps = Readonly<{
  labels: Record<string, string>;
  homeTab: ReactNode;
  clientsTab: ReactNode;
  staffTab: ReactNode;
  sectionsTab: ReactNode;
  scheduleTab: ReactNode;
  reportsTab: ReactNode;
  auditTab?: ReactNode;
}>;

export function AdminSpaContainer({
  homeTab,
  clientsTab,
  staffTab,
  sectionsTab,
  scheduleTab,
  reportsTab,
  auditTab,
}: AdminSpaContainerProps) {
  const { activeTab } = useAdminSpa();

  return (
    <div>
      {/* Render active tab content instantly */}
      <div>
        {activeTab === "home" && homeTab}
        {activeTab === "clients" && clientsTab}
        {activeTab === "staff" && staffTab}
        {activeTab === "sections" && sectionsTab}
        {activeTab === "schedule" && scheduleTab}
        {activeTab === "reports" && reportsTab}
        {activeTab === "audit" && auditTab}
      </div>
    </div>
  );
}
