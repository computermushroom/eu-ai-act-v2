// Forgot Password Page
// Client Component: email submission for password reset
// Calls /api/auth/reset-password to send reset email

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";

/**
 * Forgot password form state
 */
interface ForgotPasswordFormState {
  email: string;
}

/**
 * Forgot password page
 * User submits email to receive reset link
 */
export default function ForgotPasswordPage() {
  const [form, setForm] = useState<ForgotPasswordFormState>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

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

      if (!form.email.trim()) {
        setError("Please enter your email address.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError("Please enter a valid email address.");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to send reset email.");
          setIsLoading(false);
          return;
        }

        // Always show success (prevents email enumeration)
        setIsSent(true);
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );

  if (isSent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{form.email}</span>,
              we&apos;ve sent password reset instructions. Please check your
              inbox and spam folder.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Login
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
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
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
              htmlFor="email"
              className="text-sm font-medium leading-none"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Instructions"}
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
