"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
export type DrawerSection = Readonly<{
  label?: string;
  content: ReactNode;
}>;

export type DrawerConfig = Readonly<{
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  sections: readonly DrawerSection[];
  footer?: ReactNode;
  accentColor?: "primary" | "secondary" | "success" | "warning" | "critical";
}>;

type DrawerContextValue = Readonly<{
  open: (config: DrawerConfig) => void;
  close: () => void;
  isOpen: boolean;
}>;

/* ─────────────────────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────────────────────── */
const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useDetailDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDetailDrawer must be inside DetailDrawerProvider");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────────────────
   Provider + Drawer UI
   ───────────────────────────────────────────────────────────────────────── */
export function DetailDrawerProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DrawerConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((cfg: DrawerConfig) => {
    setConfig(cfg);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // keep config for exit animation
    setTimeout(() => setConfig(null), 300);
  }, []);

  const accentClass = {
    primary: "border-primary",
    secondary: "border-secondary",
    success: "border-status-success",
    warning: "border-status-warning",
    critical: "border-status-critical",
  }[config?.accentColor ?? "secondary"];

  return (
    <DrawerContext.Provider value={{ open, close, isOpen }}>
      {children}

      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />

      {/* Drawer Panel */}
      <aside
        aria-label={config?.title ?? "Detail"}
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col",
          "bg-surface-container-lowest border-l border-outline-variant shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {config && (
          <>
            <div className={cn("border-b border-outline-variant shrink-0", accentClass, "border-l-4 pl-4")}>
              <div className="flex items-start justify-between gap-3 p-4 pl-0">
                <div className="flex items-center gap-3 min-w-0">
                  {config.icon && (
                    <div className="bg-surface-container text-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      {config.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-heading text-on-surface text-lg font-bold truncate">{config.title}</h2>
                    {config.subtitle && (
                      <p className="text-on-surface-variant mt-0.5 text-xs truncate">{config.subtitle}</p>
                    )}
                  </div>
                </div>
                <button
                  aria-label="Schließen"
                  className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                  onClick={close}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-5 p-5">
                {config.sections.map((section, idx) => (
                  <div key={idx} className="grid gap-2">
                    {section.label && (
                      <h3 className="text-on-surface-variant text-xs font-bold tracking-wider uppercase">
                        {section.label}
                      </h3>
                    )}
                    <div>{section.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            {config.footer && (
              <div className="shrink-0 border-t border-outline-variant p-4">
                {config.footer}
              </div>
            )}
          </>
        )}
      </aside>
    </DrawerContext.Provider>
  );
}
