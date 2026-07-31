"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  type ReactNode,
} from "react";
import { Check, Pencil, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type InlineEditFieldProps = Readonly<{
  /** Current value to display and edit */
  value: string;
  /** Called when user submits a new value. Return error string or null */
  onSave: (next: string) => Promise<string | null>;
  /** Multiline textarea instead of single-line input */
  multiline?: boolean;
  /** Placeholder shown when value is empty */
  placeholder?: string;
  /** Extra class on the wrapper */
  className?: string;
  /** Text styles for the display value */
  displayClassName?: string;
  /** aria-label for the edit button */
  editLabel?: string;
  /** aria-label for the save button */
  saveLabel?: string;
  /** aria-label for the cancel button */
  cancelLabel?: string;
}>;

/**
 * InlineEditField
 *
 * Displays a value as text. On hover an edit icon appears. Clicking it
 * switches to an input/textarea. Pressing ✓ saves, ✗ or Escape cancels.
 */
export function InlineEditField({
  value,
  onSave,
  multiline = false,
  placeholder = "—",
  className,
  displayClassName,
  editLabel = "Bearbeiten",
  saveLabel = "Speichern",
  cancelLabel = "Abbrechen",
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Keep draft in sync if parent value changes while not editing
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function handleEdit() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(value);
    setError(null);
    setEditing(false);
  }

  function handleSave() {
    const trimmed = draft.trim();
    startTransition(async () => {
      const err = await onSave(trimmed);
      if (err) {
        setError(err);
      } else {
        setError(null);
        setEditing(false);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") handleCancel();
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
  }

  const sharedInputClass = cn(
    "w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2",
    "text-sm font-semibold text-on-surface outline-none",
    "focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all",
    error && "border-error focus:border-error focus:ring-error/20",
  );

  if (editing) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className={cn(sharedInputClass, "min-h-[80px] resize-y")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={isPending}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              className={sharedInputClass}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
            />
          )}
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label={saveLabel}
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                "bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary",
                "disabled:opacity-50",
              )}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </button>
            <button
              type="button"
              aria-label={cancelLabel}
              onClick={handleCancel}
              disabled={isPending}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                "bg-surface-container text-on-surface-variant hover:bg-error/10 hover:text-error",
                "disabled:opacity-50",
              )}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs font-semibold text-error">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("group flex items-start gap-1.5", className)}>
      <span
        className={cn(
          "min-h-[1.25rem] flex-1 text-sm font-semibold text-on-surface",
          !value && "text-on-surface-variant/50 italic",
          displayClassName,
        )}
      >
        {value || placeholder}
      </span>
      <button
        type="button"
        aria-label={editLabel}
        onClick={handleEdit}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md transition-all",
          "text-on-surface-variant/0 group-hover:text-on-surface-variant/60",
          "hover:bg-surface-container hover:!text-secondary",
        )}
      >
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   InlineStatusToggle
   ───────────────────────────────────────────────────────────────────────── */
type InlineStatusToggleProps = Readonly<{
  isActive: boolean;
  onToggle: () => Promise<void>;
  activeLabel: string;
  inactiveLabel: string;
  className?: string;
}>;

export function InlineStatusToggle({
  isActive,
  onToggle,
  activeLabel,
  inactiveLabel,
  className,
}: InlineStatusToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await onToggle();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all",
        "disabled:opacity-60 cursor-pointer select-none",
        isActive
          ? "bg-secondary-container text-on-secondary-container hover:bg-error/10 hover:text-error"
          : "bg-surface-container text-on-surface-variant hover:bg-secondary/10 hover:text-secondary",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <span
          className={cn(
            "size-1.5 rounded-full",
            isActive ? "bg-emerald-500" : "bg-gray-400",
          )}
        />
      )}
      {isActive ? activeLabel : inactiveLabel}
    </button>
  );
}
