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
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
type ToastVariant = "success" | "error";

type Toast = Readonly<{
  id: string;
  message: string;
  variant: ToastVariant;
}>;

type ToastContextValue = Readonly<{
  toast: (message: string, variant?: ToastVariant) => void;
}>;

/* ─────────────────────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timerRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerRefs.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);

      const timer = setTimeout(() => dismiss(id), 3500);
      timerRefs.current.set(id, timer);
    },
    [dismiss],
  );

  // Cleanup on unmount
  useEffect(() => {
    const refs = timerRefs.current;
    return () => refs.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Benachrichtigungen"
        className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Single Toast Item
   ───────────────────────────────────────────────────────────────────────── */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const isSuccess = toast.variant === "success";

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl",
        "min-w-[240px] max-w-[380px] border backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        isSuccess
          ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-100"
          : "border-red-500/30 bg-red-950/90 text-red-100",
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="size-5 shrink-0 text-red-400" />
      )}
      <p className="flex-1 text-sm font-semibold">{toast.message}</p>
      <button
        type="button"
        aria-label="Schließen"
        onClick={onDismiss}
        className={cn(
          "flex size-6 items-center justify-center rounded-lg transition-colors",
          isSuccess
            ? "hover:bg-emerald-800/50 text-emerald-300"
            : "hover:bg-red-800/50 text-red-300",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
