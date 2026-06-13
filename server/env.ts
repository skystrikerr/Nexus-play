import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  // It's okay if .env doesn't exist in production, but in dev we want to know.
  if (process.env.NODE_ENV !== "production") {
    console.warn(`Could not load .env from ${envPath}: ${result.error}`);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in environment or .env file`);
  }
  return value;
}
