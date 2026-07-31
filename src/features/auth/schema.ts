import { z } from "zod";

export type LoginActionState = Readonly<{
  errorCode: "AUTH_FAILED" | "VALIDATION_FAILED" | null;
}>;

export const initialLoginActionState: LoginActionState = {
  errorCode: null,
};

export const LoginInputSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
    locale: z.enum(["de", "en"]),
    next: z.string().max(2048).optional(),
  })
  .strict();

export const LogoutInputSchema = z
  .object({
    locale: z.enum(["de", "en"]),
  })
  .strict();
