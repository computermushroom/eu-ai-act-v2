import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Database connection for Prisma CLI commands (migrate, studio, etc.)
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
