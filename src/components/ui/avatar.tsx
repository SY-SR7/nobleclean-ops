"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useActionState, useRef } from "react";

import {
  attachEmployeeAvatarAction,
  attachClientAvatarAction,
} from "@/features/admin/avatars/actions";
import {
  initialAvatarActionState,
  type AvatarActionState,
} from "@/features/admin/avatars/schema";
import type { Locale } from "@/i18n/routing";

// ── EntityAvatar ─────────────────────────────────────────────────────────────
// Displays an avatar image with initials fallback. Pure display, no upload.

type EntityAvatarProps = Readonly<{
  avatarPath?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}>;

const sizeMap = {
  sm:  { container: "size-8",  text: "text-[11px]", badge: "" },
  md:  { container: "size-11", text: "text-sm",     badge: "" },
  lg:  { container: "size-16", text: "text-lg",     badge: "" },
  xl:  { container: "size-24", text: "text-2xl",    badge: "" },
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-indigo-700",
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-700",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-violet-700",
    "from-lime-500 to-green-700",
  ];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export function EntityAvatar({
  avatarPath,
  name,
  size = "md",
  className = "",
}: EntityAvatarProps) {
  const { container, text } = sizeMap[size];
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full",
        container,
        !avatarPath ? `bg-gradient-to-br ${gradient}` : "",
        className,
      ].join(" ")}
    >
      {avatarPath ? (
        <Image
          src={`/api/avatar?path=${encodeURIComponent(avatarPath)}`}
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <span
          className={[
            "flex h-full w-full items-center justify-center font-bold text-white",
            text,
          ].join(" ")}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// ── AvatarUpload ──────────────────────────────────────────────────────────────
// Upload control shown on employee detail / client detail pages.

type AvatarUploadVariant = "employee" | "client";

type AvatarUploadProps = Readonly<{
  entityId: string;
  entityName: string;
  currentAvatarPath?: string | null;
  locale: Locale;
  variant: AvatarUploadVariant;
  copy: {
    changeLabel: string;
    uploadLabel: string;
    savedLabel: string;
    errorLabel: string;
  };
}>;

export function AvatarUpload({
  entityId,
  entityName,
  currentAvatarPath,
  locale,
  variant,
  copy,
}: AvatarUploadProps) {
  const action =
    variant === "employee" ? attachEmployeeAvatarAction : attachClientAvatarAction;
  const idField = variant === "employee" ? "employeeId" : "clientId";

  const [state, formAction, isPending] = useActionState<AvatarActionState, FormData>(
    action,
    initialAvatarActionState,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <div className="relative">
        <EntityAvatar
          avatarPath={currentAvatarPath}
          name={entityName}
          size="xl"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-secondary text-on-secondary shadow-md transition hover:opacity-90 disabled:opacity-50"
        >
          <Camera className="size-4" />
        </button>
      </div>

      {/* Hidden form */}
      <form action={formAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name={idField} value={entityId} />
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              e.target.form?.requestSubmit();
            }
          }}
        />
      </form>

      {/* Status */}
      {state.status === "success" && (
        <p className="text-xs font-semibold text-emerald-600">{copy.savedLabel}</p>
      )}
      {state.status === "error" && (
        <p className="text-error text-xs font-semibold">{copy.errorLabel}</p>
      )}

      {isPending && (
        <p className="text-on-surface-variant text-xs animate-pulse">
          Uploading…
        </p>
      )}
    </div>
  );
}
