// Register Page
// Client Component: form state, validation, and registration API call
// Includes GDPR-required consent checkbox for terms and privacy policy

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * Registration form state
 */
interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Registration page with email/password form
 * GDPR compliant: explicit consent required for terms
 */
export default function RegisterPage() {
  const t = useTranslations();
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validation
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setError(t("auth.errors.fillRequiredFields"));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError(t("auth.errors.validEmail"));
        return;
      }

      if (form.password.length < 8) {
        setError(t("auth.errors.passwordLength"));
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError(t("auth.errors.passwordMismatch"));
        return;
      }

      if (!form.acceptTerms) {
        setError(t("auth.errors.acceptTerms"));
        return;
      }

      setIsLoading(true);

      try {
        // Call registration API
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("auth.errors.registrationFailed"));
          setIsLoading(false);
          return;
        }

        // Auto-login after successful registration
        const signInResult = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          window.location.href = "/dashboard";
        } else {
          // Registration succeeded but auto-login failed
          window.location.href = "/login?registered=true";
        }
      } catch {
        setError(t("auth.errors.unexpected"));
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
          <h1 className="text-2xl font-bold tracking-tight">
            {t("auth.register.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.register.subtitle")}
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

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none"
            >
              {t("auth.register.fullName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder={t("auth.register.fullNamePlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none"
            >
              {t("auth.register.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder={t("auth.register.emailPlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none"
            >
              {t("auth.register.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder={t("auth.register.passwordPlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium leading-none"
            >
              {t("auth.register.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
            />
          </div>

          {/* GDPR consent checkbox - NOT pre-checked */}
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="mt-1 h-4 w-4"
              disabled={isLoading}
            />
            <label htmlFor="acceptTerms" className="text-sm text-muted-foreground">
              {t("auth.register.agreeToTerms")}{" "}
              <Link href="/terms" className="text-primary hover:underline">
                {t("auth.register.termsOfService")}
              </Link>{" "}
              {t("auth.register.and")}{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                {t("auth.register.privacyPolicy")}
              </Link>
              . {t("auth.register.gdprConsent")}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? t("auth.register.creatingAccount") : t("auth.register.createAccount")}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("auth.register.orContinueWith")}
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
            {t("auth.register.google")}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn("github")}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {t("auth.register.github")}
          </button>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.register.alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
