"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
   Provider + Centered Modal UI (Khabiaa Pattern)
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
    setTimeout(() => setConfig(null), 250);
  }, []);

  // Auto-close modal immediately when active tab changes
  // Use a ref to avoid dependency-array size mismatch between HMR cycles
  const closeRef = useRef<() => void>(() => {
    setIsOpen(false);
    setConfig(null);
  });
  useEffect(() => {
    closeRef.current = () => {
      setIsOpen(false);
      setConfig(null);
    };
  });
  useEffect(() => {
    const handleTabChange = () => closeRef.current();
    window.addEventListener("nc-tab-change", handleTabChange);
    return () => window.removeEventListener("nc-tab-change", handleTabChange);
  }, []);

  const accentClass = {
    primary: "border-primary text-primary",
    secondary: "border-secondary text-secondary",
    success: "border-status-success text-status-success",
    warning: "border-status-warning text-status-warning",
    critical: "border-status-critical text-status-critical",
  }[config?.accentColor ?? "secondary"];

  return (
    <DrawerContext.Provider value={{ open, close, isOpen }}>
      {children}

      {/* Centered Modal Backdrop (Khabiaa pattern) */}
      {config && (
        <div
          aria-hidden="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-200",
            "bg-black/60 backdrop-blur-md",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Centered Modal Panel */}
          <div
            aria-label={config.title}
            aria-modal="true"
            role="dialog"
            className={cn(
              "relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-3xl",
              "bg-surface-container-lowest border border-outline-variant shadow-2xl transition-all duration-200",
              isOpen
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-3",
            )}
          >
            {/* Header */}
            <div className="border-b border-outline-variant shrink-0 bg-surface-container-low/50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {config.icon && (
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-surface-container-lowest shadow-sm",
                        accentClass,
                      )}
                    >
                      {config.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-heading text-on-surface text-xl font-bold truncate">
                      {config.title}
                    </h2>
                    {config.subtitle && (
                      <p className="text-on-surface-variant mt-0.5 text-xs font-medium truncate">
                        {config.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  aria-label="Schließen"
                  className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors border border-outline-variant/60 bg-surface-container-lowest"
                  onClick={close}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6">
                {config.sections.map((section, idx) => (
                  <div key={idx} className="grid gap-2.5">
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
              <div className="shrink-0 border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
                {config.footer}
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerContext.Provider>
  );
}
