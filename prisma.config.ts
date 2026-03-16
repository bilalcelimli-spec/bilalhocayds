import { createRequire } from "node:module";
import { defineConfig, env } from "prisma/config";

const require = createRequire(import.meta.url);

try {
  require("dotenv").config({ path: ".env", override: true });
} catch {
  // In production (e.g. Render), env vars are injected by platform.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});