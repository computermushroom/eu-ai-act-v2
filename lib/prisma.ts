// Prisma Client Singleton with Neon Serverless Driver Adapter
// Prevents connection pool exhaustion in development (hot reload)
// Prisma 7 requires Driver Adapter for Neon PostgreSQL
// https://pris.ly/d/help/nextjs-best-practices

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // PrismaNeon accepts { connectionString } directly per official docs
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy initialization: the client is only created when first accessed
// This prevents build-time errors when DATABASE_URL is not set during static generation
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = globalForPrisma.prisma;
}
