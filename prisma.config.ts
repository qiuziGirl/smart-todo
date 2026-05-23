import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (existsSync(".env.local")) {
  loadEnv({ path: ".env.local", override: false });
}

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set for Prisma CLI commands.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
