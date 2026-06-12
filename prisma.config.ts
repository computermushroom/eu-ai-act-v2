import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Database connection for Prisma CLI commands (migrate, studio, etc.)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
