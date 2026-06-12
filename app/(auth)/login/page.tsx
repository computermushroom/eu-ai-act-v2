// Login Page
// Client Component: form state, validation, and NextAuth.js signIn
// Supports: Credentials (email/password) + OAuth (Google, GitHub)

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * Login form state
 */
interface LoginFormState {
  email: string;
  password: string;
}

/**
 * Login page with email/password form and OAuth buttons
 */
export default function LoginPage() {
  const t = useTranslations();
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Basic validation
      if (!form.email.trim() || !form.password.trim()) {
        setError(t("auth.errors.fillAllFields"));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError(t("auth.errors.validEmail"));
        return;
      }

      setIsLoading(true);

      try {
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setError(t("auth.errors.invalidCredentials"));
        } else if (result?.ok) {
          // Successful login - redirect to dashboard
          window.location.href = "/dashboard";
        }
      } catch {
        setError(t("auth.errors.unexpected"));
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "github") => {
      setIsLoading(true);
      setError(null);
      try {
        await signIn(provider, { callbackUrl: "/dashboard" });
      } catch {
        setError(t("auth.errors.oauthFailed", { provider }));
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.login.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.login.subtitle")}
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

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none"
            >
              {t("auth.login.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder={t("auth.login.emailPlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                {t("auth.login.password")}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder={t("auth.login.passwordPlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? t("auth.login.signingIn") : t("auth.login.signIn")}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("auth.login.orContinueWith")}
            </span>
          </div>
        </div>

        {/* OAuth buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {t("auth.login.google")}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn("github")}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {t("auth.login.github")}
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("auth.login.createOne")}
          </Link>
        </p>
      </div>
    </div>
  );
}
