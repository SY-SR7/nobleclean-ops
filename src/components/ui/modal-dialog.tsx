"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/cn";

export type ModalDialogProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  zIndexClass?: string;
}>;

export function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  zIndexClass = "z-[150]",
}: ModalDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

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

    onClose();
    if (!clickedInsideParentCard) {
      window.dispatchEvent(new CustomEvent("nc-tab-change"));
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 overscroll-contain",
        zIndexClass,
      )}
      onWheel={(e) => e.stopPropagation()}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity pointer-events-none" />

      {/* Modal Container */}
      <div
        data-modal-panel="true"
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-6 py-4 bg-surface-container-low/50">
          <div>
            <h3 className="font-heading text-lg font-bold text-on-surface">{title}</h3>
            {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
