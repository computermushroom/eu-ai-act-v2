// NextAuth.js v5 (Auth.js) Configuration
// Supports: Credentials (email/password) + OAuth (Google, GitHub)
// Prisma Adapter for database session persistence
// GDPR-compliant: minimal data, secure session cookies
//
// References:
// - https://authjs.dev/getting-started/installation
// - https://authjs.dev/getting-started/adapters/prisma
// - https://authjs.dev/getting-started/providers/credentials

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import { createAuditLog } from "./audit";

/**
 * Credentials input validation schema
 */
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * NextAuth.js configuration object
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Session strategy: database (Prisma) for persistence
  // JWT could be used for edge compatibility, but database is more secure
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // Cookie configuration for GDPR compliance
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard",
  },

  providers: [
    // Credentials provider: email + password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Find user by email (case-insensitive)
        const user = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
            deletedAt: null, // Exclude soft-deleted accounts
          },
        });

        if (!user || !user.password) {
          // No user found or OAuth-only account
          return null;
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    // Google OAuth provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),

    // GitHub OAuth provider
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // Callbacks for session and JWT handling
  callbacks: {
    // Include user id in session for client-side use
    session: async ({ session, user }) => {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },

    // Redirect after sign-in
    redirect: async ({ url, baseUrl }) => {
      // Allow relative URLs and same-origin absolute URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },

  // Events for audit logging (GDPR compliance)
  events: {
    signIn: async ({ user, account }) => {
      try {
        await createAuditLog({
          userId: user.id,
          action: "user_login",
          resource: "auth",
          details: {
            email: user.email,
            provider: account?.provider ?? "credentials",
            method: account?.provider ?? "credentials",
          },
        });
      } catch (error) {
        console.error("[AUTH AUDIT] Failed to log signIn:", error);
      }
    },
    signOut: async (message) => {
      try {
        // NextAuth v5 signOut event receives { session: AdapterSession } or { token: JWT }
        // AdapterSession has userId (string), not nested user object
        const userId =
          "session" in message && (message.session as { userId?: string })?.userId
            ? (message.session as { userId: string }).userId
            : "token" in message && message.token?.sub
              ? message.token.sub
              : null;
        if (userId) {
          await createAuditLog({
            userId,
            action: "user_logout",
            resource: "auth",
            details: { method: "session" },
          });
        }
      } catch (error) {
        console.error("[AUTH AUDIT] Failed to log signOut:", error);
      }
    },
    createUser: async ({ user }) => {
      try {
        await createAuditLog({
          userId: user.id,
          action: "user_registered",
          resource: "auth",
          details: {
            email: user.email,
            method: "oauth",
          },
        });
      } catch (error) {
        console.error("[AUTH AUDIT] Failed to log createUser:", error);
      }

      // Create free subscription for new user
      try {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            status: "inactive",
            tier: "free",
          },
        });
      } catch (error) {
        console.error("[AUTH] Failed to create free subscription:", error);
      }
    },
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
});
