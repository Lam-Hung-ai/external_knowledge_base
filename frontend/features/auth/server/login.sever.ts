"use server";

import { auth } from "@/lib/auth";
import { loginType } from "../auth.schemas";
export const loginEmail = async (
  loginForm: loginType,
): Promise<{ success: boolean; message: string }> => {
  try {
    await auth.api.signInEmail({
      body: {
        email: loginForm.email,
        password: loginForm.password,
      },
    });
    return { success: true, message: "Login successfully" };
  } catch (error) {
    const e = error as Error;
    console.log(e);
    return { success: false, message: e.message || "Try again later" };
  }
};
