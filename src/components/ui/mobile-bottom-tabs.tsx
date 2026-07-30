import { Bell, CheckSquare, Clock3, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const defaultIcons = {
  history: Clock3,
  notifications: Bell,
  profile: UserRound,
  tasks: CheckSquare,
} satisfies Record<string, LucideIcon>;

type MobileBottomTabItem = Readonly<{
  active?: boolean;
  href?: string;
  icon?: ReactNode;
  id: keyof typeof defaultIcons | (string & {});
  label: ReactNode;
  onSelect?: () => void;
}>;

export type EmployeeMobileBottomTabItem = MobileBottomTabItem;

type EmployeeMobileBottomTabsProps = Readonly<{
  className?: string;
  items: readonly MobileBottomTabItem[];
  label: string;
}>;

export function EmployeeMobileBottomTabs({
  className,
  items,
  label,
}: EmployeeMobileBottomTabsProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "border-outline-variant bg-surface-container-lowest shadow-level-2 fixed right-0 bottom-0 left-0 z-40 border-t px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden",
        className,
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const DefaultIcon =
            defaultIcons[item.id as keyof typeof defaultIcons] ?? CheckSquare;
          const icon = item.icon ?? (
            <DefaultIcon aria-hidden="true" className="size-5" />
          );
          const itemClassName = cn(
            "focus-visible:ring-secondary focus-visible:ring-offset-surface-container-lowest inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded px-2 text-xs font-semibold text-on-surface-variant transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            item.active
              ? "bg-surface-accent text-primary-container"
              : "hover:bg-surface-container-low hover:text-on-surface",
          );

          if (item.href) {
            return (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={itemClassName}
                href={item.href}
                key={item.id}
              >
                {icon}
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              className={itemClassName}
              key={item.id}
              onClick={item.onSelect}
              type="button"
            >
              {icon}
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
