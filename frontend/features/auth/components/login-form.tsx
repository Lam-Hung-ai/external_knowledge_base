"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "../auth.schemas";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import { GoogleIcon } from "./google-icon";
import {loginWithEmail} from "@/features/auth/auth.service";

export function LoginForm({
  className,
  oauthError,
  ...props
}: React.ComponentProps<"div"> & { oauthError?: string }) {
  const router = useRouter();
  const { isGooglePending, signInWithGoogle } = useGoogleSignIn("/login");
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const isBusy = isSubmitting || isGooglePending;

  async function onSubmit(data: LoginInput) {
    const result = await loginWithEmail(data);

    if (!result.success) {
      if (result.code === "INVALID_CREDENTIALS") {
        form.setError("root", {
          message: "Email or password is incorrect.",
        });
        return;
      }

      if (result.code === "INVALID_INPUT") {
        form.setError("root", {
          message: "Check your details and try again.",
        });
        return;
      }

      toast.error("Unable to sign in right now. Please try again later.");
      return;
    }

    toast.success("Signed in successfully.");
    router.replace("/");
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with Google or your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            aria-busy={isBusy}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isBusy}
                  onClick={signInWithGoogle}
                >
                  {isGooglePending ? (
                    <Loader2Icon
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  {isGooglePending ? "Connecting..." : "Continue with Google"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              {oauthError && (
                <FieldError>
                  {oauthError === "account_not_linked"
                    ? "This email is registered with a password. Sign in with your email and password instead."
                    : "Google sign-in failed. Please try again."}
                </FieldError>
              )}

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="m@example.com"
                      disabled={isBusy}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      disabled={isBusy}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {form.formState.errors.root?.message && (
                <FieldError>{form.formState.errors.root.message}</FieldError>
              )}

              <Field>
                <Button type="submit" disabled={isBusy}>
                  {isSubmitting && (
                    <Loader2Icon
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to the Terms of Service and Privacy Policy.
      </FieldDescription>
    </div>
  );
}
