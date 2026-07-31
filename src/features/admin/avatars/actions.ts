"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSameOriginRequest } from "@/lib/security/request-origin";
import { requireRole } from "@/server/auth/guards";
import { z } from "zod";

import { initialAvatarActionState, type AvatarActionState } from "./schema";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

// ── Image type validation (same as reference-images) ─────────────────────────

const AvatarImageTypes = {
  "image/jpeg": {
    extension: "jpg",
    magic: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    magic: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    extension: "webp",
    magic: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
} as const;

const MaxAvatarBytes = 3 * 1024 * 1024;
const MaxAvatarPixelsPerSide = 4000;

async function validateAvatarImage(file: File) {
  const imageType =
    AvatarImageTypes[file.type as keyof typeof AvatarImageTypes];

  if (!imageType || file.size <= 0 || file.size > MaxAvatarBytes) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!imageType.magic(buffer)) {
    return null;
  }

  try {
    const metadata = await sharp(buffer).metadata();

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MaxAvatarPixelsPerSide ||
      metadata.height > MaxAvatarPixelsPerSide
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    buffer,
    contentType: file.type,
    extension: imageType.extension,
  };
}

async function getAdminMutationClient(locale: "de" | "en") {
  if (!(await hasSameOriginRequest())) {
    return null;
  }
  await requireRole(locale, "admin");
  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

function avatarObjectName(entityType: "employees" | "clients", entityId: string, extension: string) {
  return `avatars/${entityType}/${entityId}/${randomUUID()}.${extension}`;
}

// ── Employee avatar upload ────────────────────────────────────────────────────

async function employeeExists(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_path")
    .eq("id", id)
    .eq("role", "employee")
    .maybeSingle();
  if (error || !data) return null;
  return { avatarPath: typeof data.avatar_path === "string" ? data.avatar_path : null };
}

async function clientExists(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, avatar_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { avatarPath: typeof data.avatar_path === "string" ? data.avatar_path : null };
}

export async function attachEmployeeAvatarAction(
  _previousState: AvatarActionState = initialAvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  void _previousState;

  const localeRaw = formData.get("locale");
  const employeeIdRaw = formData.get("employeeId");

  const locale = z.enum(["de", "en"]).safeParse(localeRaw);
  const employeeId = z.string().uuid().safeParse(employeeIdRaw);

  if (!locale.success || !employeeId.success) {
    return { code: "VALIDATION_FAILED", status: "error" };
  }

  const files = formData.getAll("avatar");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return { code: "VALIDATION_FAILED", status: "error" };
  }

  const supabase = await getAdminMutationClient(locale.data);
  if (!supabase) return { code: "AUTH_FAILED", status: "error" };

  const existing = await employeeExists(supabase, employeeId.data);
  if (!existing) return { code: "VALIDATION_FAILED", status: "error" };

  const image = await validateAvatarImage(files[0]);
  if (!image) return { code: "VALIDATION_FAILED", status: "error" };

  const objectName = avatarObjectName("employees", employeeId.data, image.extension);
  const bucket = supabase.storage.from("avatars");
  const { error: uploadError } = await bucket.upload(objectName, image.buffer, {
    contentType: image.contentType,
    upsert: false,
  });

  if (uploadError) return { code: "SAVE_FAILED", status: "error" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: objectName })
    .eq("id", employeeId.data)
    .eq("role", "employee");

  if (updateError) {
    await bucket.remove([objectName]);
    return { code: "SAVE_FAILED", status: "error" };
  }

  if (existing.avatarPath) {
    await bucket.remove([existing.avatarPath]);
  }

  revalidatePath(`/${locale.data}/admin/staff/${employeeId.data}`);
  revalidatePath(`/${locale.data}/admin`);
  return { code: "AVATAR_ATTACHED", status: "success" };
}

// ── Client avatar upload ──────────────────────────────────────────────────────

export async function attachClientAvatarAction(
  _previousState: AvatarActionState = initialAvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  void _previousState;

  const localeRaw = formData.get("locale");
  const clientIdRaw = formData.get("clientId");

  const locale = z.enum(["de", "en"]).safeParse(localeRaw);
  const clientId = z.string().uuid().safeParse(clientIdRaw);

  if (!locale.success || !clientId.success) {
    return { code: "VALIDATION_FAILED", status: "error" };
  }

  const files = formData.getAll("avatar");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return { code: "VALIDATION_FAILED", status: "error" };
  }

  const supabase = await getAdminMutationClient(locale.data);
  if (!supabase) return { code: "AUTH_FAILED", status: "error" };

  const existing = await clientExists(supabase, clientId.data);
  if (!existing) return { code: "VALIDATION_FAILED", status: "error" };

  const image = await validateAvatarImage(files[0]);
  if (!image) return { code: "VALIDATION_FAILED", status: "error" };

  const objectName = avatarObjectName("clients", clientId.data, image.extension);
  const bucket = supabase.storage.from("avatars");
  const { error: uploadError } = await bucket.upload(objectName, image.buffer, {
    contentType: image.contentType,
    upsert: false,
  });

  if (uploadError) return { code: "SAVE_FAILED", status: "error" };

  const { error: updateError } = await supabase
    .from("clients")
    .update({ avatar_path: objectName })
    .eq("id", clientId.data);

  if (updateError) {
    await bucket.remove([objectName]);
    return { code: "SAVE_FAILED", status: "error" };
  }

  if (existing.avatarPath) {
    await bucket.remove([existing.avatarPath]);
  }

  revalidatePath(`/${locale.data}/admin/clients/${clientId.data}`);
  revalidatePath(`/${locale.data}/admin`);
  return { code: "AVATAR_ATTACHED", status: "success" };
}
