import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function resolvePrismaCliUrl() {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }

  const databaseUrl = env("DATABASE_URL");
  const parsedUrl = new URL(databaseUrl);
  parsedUrl.hostname = parsedUrl.hostname.replace("-pooler.", ".");
  return parsedUrl.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node_modules\\.bin\\tsx.CMD prisma/seed.ts",
  },
  datasource: {
    url: resolvePrismaCliUrl(),
  },
});
