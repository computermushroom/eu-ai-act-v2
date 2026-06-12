// Reset Password Page
// Client Component: new password form after clicking reset link
// Reads token from URL query parameter, calls /api/auth/reset-password/confirm

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Reset password form state
 */
interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
}

/**
 * Reset password form content (needs useSearchParams which requires Suspense)
 */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState<ResetPasswordFormState>({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!token) {
        setError("Invalid reset link. Please request a new one.");
        return;
      }

      if (form.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/reset-password/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: form.password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to reset password.");
          setIsLoading(false);
          return;
        }

        setIsSuccess(true);
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [token, form]
  );

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Password reset successful
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Invalid link</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Reset form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium leading-none"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Back to login */}
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Reset Password Page with Suspense boundary
 * Required because useSearchParams() needs Suspense in Next.js 16
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
