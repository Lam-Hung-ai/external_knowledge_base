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
import { signupWithEmail } from "../actions/auth.actions";
import { signupSchema, type SignupInput } from "../auth.schemas";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import { GoogleIcon } from "./google-icon";

export function SignupForm({
  className,
  oauthError,
  ...props
}: React.ComponentProps<"div"> & { oauthError?: string }) {
  const router = useRouter();
  const { isGooglePending, signInWithGoogle } = useGoogleSignIn("/signup");
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const isBusy = isSubmitting || isGooglePending;

  async function onSubmit(data: SignupInput) {
    const result = await signupWithEmail(data);

    if (!result.success) {
      if (result.code === "EMAIL_IN_USE") {
        form.setError("email", {
          message: "An account with this email already exists.",
        });
        return;
      }

      if (result.code === "INVALID_INPUT") {
        form.setError("root", {
          message: "Check your details and try again.",
        });
        return;
      }

      toast.error("Unable to create your account. Please try again later.");
      return;
    }

    toast.success("Your account has been created.");
    router.replace("/");
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Sign up with Google or your email address
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
                <FieldError>Google sign-up failed. Please try again.</FieldError>
              )}

              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="signup-email"
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

              <div className="grid gap-5 sm:grid-cols-2">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
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
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-confirm-password">
                        Confirm password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="signup-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        disabled={isBusy}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <FieldDescription>
                Use at least 8 characters for your password.
              </FieldDescription>

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
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
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
