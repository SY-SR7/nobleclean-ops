"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, ArrowLeft } from "lucide-react";
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
  id?: string;
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
  closeAll: () => void;
  isOpen: boolean;
  stackLength: number;
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
   Reusable Components (InfoGrid & KpiStrip) — Interactive & Clickable
   ───────────────────────────────────────────────────────────────────────── */
export function InfoGrid({
  items,
}: {
  items: readonly { icon?: ReactNode; label: string; value: ReactNode; onClick?: () => void }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.onClick}
          className={cn(
            "rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 p-3.5 shadow-sm transition-all",
            item.onClick && "cursor-pointer hover:bg-surface-container hover:border-secondary select-none group",
          )}
        >
          <p className="text-on-surface-variant flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 group-hover:text-secondary transition-colors">
            {item.icon && <span className="text-secondary">{item.icon}</span>}
            {item.label}
          </p>
          <div className="text-on-surface font-semibold text-sm group-hover:text-secondary transition-colors">
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
        <button
          key={i}
          type="button"
          onClick={item.onClick}
          className={cn(
            "px-3 py-3.5 text-center transition-all cursor-pointer hover:bg-surface-container/80 select-none group border-none bg-transparent w-full",
            i > 0 && "border-l border-outline-variant/60",
            item.active && "bg-secondary/10 border-b-2 border-secondary",
          )}
        >
          <p className={cn("font-heading text-xl font-extrabold group-hover:text-secondary transition-colors", item.color ?? "text-on-surface")}>
            {item.value}
          </p>
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mt-0.5 group-hover:text-secondary transition-colors">
            {item.label}
          </p>
          {item.sub && (
            <p className="text-on-surface-variant/80 text-[10px] font-semibold mt-0.5">
              {item.sub}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Provider + Multi-level Stacked Centered Modal UI
   ───────────────────────────────────────────────────────────────────────── */
export function DetailDrawerProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<DrawerConfig[]>([]);

  const open = useCallback((cfg: DrawerConfig) => {
    setStack((prev) => [...prev, cfg]);
  }, []);

  const close = useCallback(() => {
    setStack((prev) => (prev.length > 0 ? prev.slice(0, prev.length - 1) : []));
  }, []);

  const closeAll = useCallback(() => {
    setStack([]);
  }, []);

  const closeAllRef = useRef(closeAll);
  useEffect(() => {
    closeAllRef.current = closeAll;
  });

  useEffect(() => {
    const handleTabChange = () => closeAllRef.current();
    window.addEventListener("nc-tab-change", handleTabChange);
    return () => window.removeEventListener("nc-tab-change", handleTabChange);
  }, []);

  const isOpen = stack.length > 0;

  // Prevent background page scroll when any modal is open
  useEffect(() => {
    if (stack.length > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [stack.length]);

  return (
    <DrawerContext.Provider value={{ open, close, closeAll, isOpen, stackLength: stack.length }}>
      {children}

      {/* Render each modal in the stack with incremental Z-Index */}
      {stack.map((config, index) => {
        const isTop = index === stack.length - 1;
        const zIndex = 60 + index * 10; // First modal z-60, second modal z-70, third z-80

        const accentClass = {
          primary: "border-primary text-primary bg-primary/10",
          secondary: "border-secondary text-secondary bg-secondary/10",
          success: "border-status-success text-status-success bg-status-success/10",
          warning: "border-status-warning text-status-warning bg-status-warning/10",
          critical: "border-status-critical text-status-critical bg-status-critical/10",
        }[config.accentColor ?? "secondary"];

        const badgeStyles = {
          success: "bg-secondary-container text-on-secondary-container border-secondary/20",
          warning: "bg-warning-container text-on-warning-container border-warning/20",
          critical: "bg-error-container text-on-error-container border-error/20",
          neutral: "bg-surface-container text-on-surface-variant border-outline-variant",
        }[config.badge?.variant ?? "success"];

        return (
          <div
            key={config.id || `drawer-level-${index}`}
            aria-hidden="true"
            style={{ zIndex }}
            className={cn(
              "fixed inset-0 flex items-center justify-center p-3 sm:p-6 transition-all duration-200",
              "bg-black/65 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain",
            )}
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => {
              // Click outside/backdrop closes ALL modals directly to section page
              if (e.target === e.currentTarget && isTop) closeAll();
            }}
          >
            {/* Modal Panel */}
            <div
              aria-label={config.title}
              aria-modal="true"
              role="dialog"
              className={cn(
                "relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl",
                "bg-surface-container-lowest border border-outline-variant shadow-2xl transition-all duration-250",
                "scale-100 opacity-100 translate-y-0 animate-in zoom-in-95 duration-200",
              )}
            >
              {/* Header */}
              <div className="border-b border-outline-variant/70 shrink-0 bg-surface-container-low/60 px-6 py-4 sm:py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Back arrow (←) pops 1 step back in history stack */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={close}
                        className="text-secondary hover:bg-secondary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition border border-secondary/30 bg-surface-container-lowest shadow-sm cursor-pointer mr-1"
                        title="Zurück (Vorheriges Fenster)"
                      >
                        <ArrowLeft className="size-4" />
                      </button>
                    )}

                    {config.icon && (
                      <div
                        className={cn(
                          "flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm text-xl",
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

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Close button (✕) closes ALL modals directly to main screen */}
                    <button
                      aria-label="Schließen (Zurück zum Bereich)"
                      className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all border border-outline-variant/60 bg-surface-container-lowest shadow-sm cursor-pointer"
                      onClick={closeAll}
                      type="button"
                      title="Alle Naffäden schließen"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive KPI Strip */}
              {config.kpis && <KpiStrip items={config.kpis} />}

              {/* Scrollable Body with overscroll containment */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
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

              {/* Footer */}
              {config.footer && (
                <div className="shrink-0 border-t border-outline-variant/70 bg-surface-container-low/50 px-6 py-4">
                  {config.footer}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </DrawerContext.Provider>
  );
}
