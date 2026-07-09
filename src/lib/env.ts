import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  XAI_API_KEY: z.string().min(1).optional(),
  XAI_BASE_URL: z.string().url().default("https://api.x.ai/v1"),
  XAI_MODEL: z.string().min(1).default("grok-4.3-latest"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  XAI_API_KEY: process.env.XAI_API_KEY,
  XAI_BASE_URL: process.env.XAI_BASE_URL,
  XAI_MODEL: process.env.XAI_MODEL,
});
