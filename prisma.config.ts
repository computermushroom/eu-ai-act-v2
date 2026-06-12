import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local for Prisma CLI commands
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Database connection for Prisma CLI commands (migrate, studio, etc.)
  datasource: {
    url: env("DIRECT_DATABASE_URL") || env("DATABASE_URL"),
  },
});
