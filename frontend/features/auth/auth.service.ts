"use server";

import { APIError } from "better-auth";

import { auth } from "@/lib/auth";
import { loginSchema, signupSchema } from "./auth.schemas";

export type AuthActionResult =
  | { success: true }
  | {
    success: false;
    code:
    | "INVALID_INPUT"
    | "INVALID_CREDENTIALS"
    | "EMAIL_IN_USE"
    | "INTERNAL_ERROR";
  };

function getBetterAuthErrorCode(error: unknown) {
  if (!(error instanceof APIError)) {
    return undefined;
  }

  return error.body?.code;
}

export async function loginWithEmail(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: "INVALID_INPUT" };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      },
    });

    return { success: true };
  } catch (error) {
    if (getBetterAuthErrorCode(error) === "INVALID_EMAIL_OR_PASSWORD") {
      return { success: false, code: "INVALID_CREDENTIALS" };
    }

    console.error("Email sign-in failed", error);
    return { success: false, code: "INTERNAL_ERROR" };
  }
}

export async function signupWithEmail(
  input: unknown,
): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: "INVALID_INPUT" };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      },
    });

    return { success: true };
  } catch (error) {
    if (
      getBetterAuthErrorCode(error) ===
      "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
      return { success: false, code: "EMAIL_IN_USE" };
    }

    console.error("Email sign-up failed", error);
    return { success: false, code: "INTERNAL_ERROR" };
  }
}
