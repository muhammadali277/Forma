import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same order as Next.js: values in .env.local win over .env.
config({ path: [".env.local", ".env"], quiet: true });

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is missing. Add it to the .env file in the project folder.");

let url: URL;
try {
  url = new URL(raw);
} catch {
  throw new Error("DATABASE_URL isn't a valid address. If your password contains symbols like # / ? @ %, reset it to letters and numbers only.");
}

// Hosted databases (Supabase, Neon, ...) need SSL; a database on this computer usually doesn't.
// Any ?sslmode=... in the address is replaced so it can't fail on Supabase's certificate.
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
for (const key of ["sslmode", "ssl", "uselibpqcompat"]) url.searchParams.delete(key);
if (!isLocal) url.searchParams.set("sslmode", "no-verify");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: url.toString() },
});
