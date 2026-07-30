"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
export type KpiItem = Readonly<{
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
  onClick?: () => void;
  active?: boolean;
}>;

export type DrawerSection = Readonly<{
  label?: string;
  content: ReactNode;
}>;

export type DrawerConfig = Readonly<{
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: Readonly<{
    label: string;
    variant?: "success" | "warning" | "critical" | "neutral";
  }>;
  kpis?: readonly KpiItem[];
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
   Reusable Khabiaa-Style Components (InfoGrid & KpiStrip)
   ───────────────────────────────────────────────────────────────────────── */
export function InfoGrid({
  items,
}: {
  items: readonly { icon?: ReactNode; label: string; value: ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 p-3.5 shadow-sm">
          <p className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
            {item.icon && <span className="text-secondary">{item.icon}</span>}
            {item.label}
          </p>
          <div className="text-on-surface font-semibold text-sm">
            {item.value || <span className="text-on-surface-variant/50">—</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KpiStrip({ items }: { items: readonly KpiItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      className="grid border-b border-outline-variant/60 bg-surface-container-lowest/80 flex-shrink-0"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.onClick}
          className={cn(
            "px-3 py-3.5 text-center transition-all",
            i > 0 && "border-l border-outline-variant/60",
            item.onClick && "cursor-pointer hover:bg-surface-container select-none",
            item.active && "bg-secondary/10 border-b-2 border-secondary",
          )}
        >
          <p className={cn("font-heading text-xl font-extrabold", item.color ?? "text-on-surface")}>
            {item.value}
          </p>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mt-0.5">
            {item.label}
          </p>
          {item.sub && (
            <p className="text-on-surface-variant/80 text-[10px] font-semibold mt-0.5">
              {item.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Provider + Centered Modal UI (Exact Khabiaa Pattern)
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
    primary: "border-primary text-primary bg-primary/10",
    secondary: "border-secondary text-secondary bg-secondary/10",
    success: "border-status-success text-status-success bg-status-success/10",
    warning: "border-status-warning text-status-warning bg-status-warning/10",
    critical: "border-status-critical text-status-critical bg-status-critical/10",
  }[config?.accentColor ?? "secondary"];

  const badgeStyles = {
    success: "bg-secondary-container text-on-secondary-container border-secondary/20",
    warning: "bg-warning-container text-on-warning-container border-warning/20",
    critical: "bg-error-container text-on-error-container border-error/20",
    neutral: "bg-surface-container text-on-surface-variant border-outline-variant",
  }[config?.badge?.variant ?? "success"];

  return (
    <DrawerContext.Provider value={{ open, close, isOpen }}>
      {children}

      {/* Centered Modal Backdrop (Khabiaa pattern) */}
      {config && (
        <div
          aria-hidden="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 transition-all duration-200",
            "bg-black/65 backdrop-blur-md",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Centered Modal Panel (Khabiaa exact dimensions & animations) */}
          <div
            aria-label={config.title}
            aria-modal="true"
            role="dialog"
            className={cn(
              "relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl",
              "bg-surface-container-lowest border border-outline-variant shadow-2xl transition-all duration-250",
              isOpen
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-4",
            )}
          >
            {/* Khabiaa Header */}
            <div className="border-b border-outline-variant/70 shrink-0 bg-surface-container-low/60 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {config.icon && (
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm text-xl",
                        accentClass,
                      )}
                    >
                      {config.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-heading text-on-surface text-lg sm:text-xl font-extrabold truncate">
                        {config.title}
                      </h2>
                      {config.badge && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shrink-0",
                            badgeStyles,
                          )}
                        >
                          {config.badge.label}
                        </span>
                      )}
                    </div>
                    {config.subtitle && (
                      <p className="text-on-surface-variant mt-0.5 text-xs font-medium truncate">
                        {config.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  aria-label="Schließen"
                  className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all border border-outline-variant/60 bg-surface-container-lowest shadow-sm cursor-pointer"
                  onClick={close}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Khabiaa KPI Strip */}
            {config.kpis && <KpiStrip items={config.kpis} />}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {config.sections.map((section, idx) => (
                <div key={idx} className="grid gap-3">
                  {section.label && (
                    <h3 className="text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase">
                      {section.label}
                    </h3>
                  )}
                  <div>{section.content}</div>
                </div>
              ))}
            </div>

            {/* Khabiaa Footer */}
            {config.footer && (
              <div className="shrink-0 border-t border-outline-variant/70 bg-surface-container-low/50 px-6 py-4">
                {config.footer}
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerContext.Provider>
  );
}
