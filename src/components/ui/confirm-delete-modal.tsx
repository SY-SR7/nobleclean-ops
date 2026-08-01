"use client";

import { useEffect, useRef, useTransition } from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ConfirmDeleteModalProps = Readonly<{
  /** Whether the modal is visible */
  open: boolean;
  /** Name/label of the entity being deleted (shown in the dialog) */
  entityName: string;
  /** Called when the user confirms deletion */
  onConfirm: () => Promise<void>;
  /** Called when the user cancels */
  onCancel: () => void;
  /** Override confirmation button text */
  confirmLabel?: string;
  /** Override cancel button text */
  cancelLabel?: string;
  /** Override title */
  title?: string;
  /** Override body text */
  body?: string;
}>;

/**
 * ConfirmDeleteModal
 *
 * A modal dialog that asks for confirmation before deleting an entity.
 * Traps focus, closes on Escape, and shows a spinner while the action runs.
 */
export function ConfirmDeleteModal({
  open,
  entityName,
  onConfirm,
  onCancel,
  confirmLabel = "Löschen",
  cancelLabel = "Abbrechen",
  title = "Eintrag löschen?",
  body,
}: ConfirmDeleteModalProps) {
  const [isPending, startTransition] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isPending, onCancel]);

  // Focus confirm button when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm();
    });
  }

  const defaultBody = `„${entityName}" wird unwiderruflich gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.`;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || isPending) return;

    const clickX = e.clientX;
    const clickY = e.clientY;

    const modalPanels = document.querySelectorAll<HTMLElement>("[data-modal-panel='true']");
    let clickedInsideParentCard = false;

    modalPanels.forEach((panel) => {
      if (e.currentTarget.contains(panel)) return;
      const rect = panel.getBoundingClientRect();
      if (
        clickX >= rect.left &&
        clickX <= rect.right &&
        clickY >= rect.top &&
        clickY <= rect.bottom
      ) {
        clickedInsideParentCard = true;
      }
    });

    onCancel();
    if (!clickedInsideParentCard) {
      window.dispatchEvent(new CustomEvent("nc-tab-change"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

      {/* Panel */}
      <div
        data-modal-panel="true"
        className="relative z-10 w-full max-w-sm rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Schließen"
          onClick={() => !isPending && onCancel()}
          disabled={isPending}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
        >
          <X className="size-4" />
        </button>

        {/* Icon + Title */}
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="size-7 text-error" />
          </div>
          <h2
            id="confirm-delete-title"
            className="font-heading text-lg font-bold text-on-surface"
          >
            {title}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {body ?? defaultBody}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => !isPending && onCancel()}
            disabled={isPending}
            className={cn(
              "flex-1 rounded-xl border border-outline-variant py-2.5 text-sm font-bold",
              "text-on-surface-variant transition hover:bg-surface-container",
              "disabled:opacity-50",
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold",
              "bg-error text-on-error transition hover:bg-error/80",
              "disabled:opacity-50",
            )}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
