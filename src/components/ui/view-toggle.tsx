"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

export function useViewMode(storageKey: string, defaultMode: ViewMode = "grid"): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nc-view-${storageKey}`);
      if (saved === "grid" || saved === "list") setMode(saved as ViewMode);
    } catch {}
  }, [storageKey]);

  const handleChange = (m: ViewMode) => {
    setMode(m);
    try { localStorage.setItem(`nc-view-${storageKey}`, m); } catch {}
  };

  return [mode, handleChange];
}

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant bg-surface-container-lowest p-0.5">
      <button
        type="button"
        aria-label="Rasteransicht"
        title="Rasteransicht"
        onClick={() => onChange("grid")}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-md transition-all",
          mode === "grid"
            ? "bg-secondary text-on-secondary shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container",
        ].join(" ")}
      >
        <LayoutGrid className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Listenansicht"
        title="Listenansicht"
        onClick={() => onChange("list")}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-md transition-all",
          mode === "list"
            ? "bg-secondary text-on-secondary shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container",
        ].join(" ")}
      >
        <List className="size-3.5" />
      </button>
    </div>
  );
}
