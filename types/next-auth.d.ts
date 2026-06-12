// NextAuth.js type extensions
// Extends the default session and user types to include custom fields
// https://authjs.dev/getting-started/typescript

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id?: string;
  }
}
