"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useDetailDrawer } from "./detail-drawer";

type FormModalTriggerProps = Readonly<{
  buttonLabel: string;
  modalTitle: string;
  modalIcon?: ReactNode;
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "critical";
  className?: string;
}>;

export function FormModalTrigger({
  buttonLabel,
  modalTitle,
  modalIcon,
  children,
  variant = "secondary",
  className,
}: FormModalTriggerProps) {
  const { open } = useDetailDrawer();

  const handleOpen = () => {
    open({
      title: modalTitle,
      icon: modalIcon || <Plus className="size-6 text-secondary" />,
      accentColor: variant,
      sections: [
        {
          content: <div className="pt-2">{children}</div>,
        },
      ],
    });
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className={
        className ||
        "bg-secondary text-on-secondary hover:opacity-90 transition px-5 py-3 rounded-2xl font-extrabold text-sm shadow-sm flex items-center gap-2 cursor-pointer w-fit"
      }
    >
      <Plus className="size-4" />
      {buttonLabel}
    </button>
  );
}
