"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PortalTab = Readonly<{
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}>;

export function SectionPortalTabs({
  tabs,
  activeTabId,
  onChange,
}: {
  tabs: readonly PortalTab[];
  activeTabId?: string;
  onChange?: (id: string) => void;
}) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? "");
  const activeId = activeTabId ?? internalTab;

  const handleSelect = (id: string) => {
    setInternalTab(id);
    onChange?.(id);
  };

  const currentTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="grid gap-6">
      {/* Sub-Tab / Portal Buttons Bar */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer select-none shrink-0",
                isActive
                  ? "bg-secondary text-on-secondary shadow-md"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/60",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Portal Content (Full Width) */}
      <div className="w-full">{currentTab?.content}</div>
    </div>
  );
}
