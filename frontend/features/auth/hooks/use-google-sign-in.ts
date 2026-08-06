"use client";

import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export function useGoogleSignIn(errorCallbackURL: "/login" | "/signup") {
  const [isGooglePending, setIsGooglePending] = useState(false);

  async function signInWithGoogle() {
    setIsGooglePending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL,
      });

      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        setIsGooglePending(false);
      }
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setIsGooglePending(false);
    }
  }

  return { isGooglePending, signInWithGoogle };
}
