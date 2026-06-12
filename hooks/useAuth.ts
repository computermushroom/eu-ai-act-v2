// useAuth Hook
// Centralized authentication state and actions for Client Components
// Wraps NextAuth's useSession with convenience methods

"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useCallback, useMemo } from "react";

/**
 * Authentication state and actions
 */
interface UseAuthReturn {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the session is currently loading */
  isLoading: boolean;
  /** The current user's ID (null if not authenticated) */
  userId: string | null;
  /** The current user's email */
  email: string | null;
  /** The current user's display name */
  name: string | null;
  /** The current user's avatar URL */
  image: string | null;
  /** Sign in with credentials */
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  /** Sign in with OAuth provider */
  loginWithProvider: (provider: "google" | "github") => Promise<void>;
  /** Sign out the current user */
  logout: () => Promise<void>;
}

/**
 * Hook for accessing authentication state and actions
 * Use in Client Components that need auth awareness
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const userId = useMemo(
    () => (session?.user?.id ?? null),
    [session?.user?.id]
  );
  const email = useMemo(
    () => (session?.user?.email ?? null),
    [session?.user?.email]
  );
  const name = useMemo(
    () => (session?.user?.name ?? null),
    [session?.user?.name]
  );
  const image = useMemo(
    () => (session?.user?.image ?? null),
    [session?.user?.image]
  );

  const loginWithCredentials = useCallback(
    async (emailValue: string, password: string): Promise<boolean> => {
      const result = await signIn("credentials", {
        email: emailValue,
        password,
        redirect: false,
      });
      return result?.ok ?? false;
    },
    []
  );

  const loginWithProvider = useCallback(
    async (provider: "google" | "github") => {
      await signIn(provider, { callbackUrl: "/dashboard" });
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  return {
    isAuthenticated,
    isLoading,
    userId,
    email,
    name,
    image,
    loginWithCredentials,
    loginWithProvider,
    logout,
  };
}
