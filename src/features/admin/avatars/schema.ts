export type AvatarActionState = Readonly<{
  code: "AUTH_FAILED" | "AVATAR_ATTACHED" | "SAVE_FAILED" | "VALIDATION_FAILED" | null;
  status: "error" | "idle" | "success";
}>;

export const initialAvatarActionState: AvatarActionState = {
  code: null,
  status: "idle",
};
