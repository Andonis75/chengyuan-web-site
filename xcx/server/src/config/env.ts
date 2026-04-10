import "dotenv/config";

import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4300),
  DATABASE_URL: z.string().min(1),
  WECHAT_APP_ID: optionalString,
  WECHAT_APP_SECRET: optionalString,
  PDF_FONT_PATH: optionalString,
  MODEL_PROVIDER: z.enum(["MOCK", "PYTHON_HTTP"]).default("MOCK"),
  PYTHON_MODEL_BASE_URL: z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, z.string().url().optional()),
  PYTHON_MODEL_PREDICT_PATH: z.string().default("/predict"),
  PYTHON_MODEL_HEALTH_PATH: z.string().default("/health"),
  PYTHON_MODEL_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  PYTHON_MODEL_API_KEY: optionalString,
  SESSION_SECRET: optionalString,
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
  FILE_STORAGE_DRIVER: z.enum(["LOCAL"]).default("LOCAL"),
  FILE_STORAGE_LOCAL_DIR: optionalString
});

export const env = envSchema.parse(process.env);
