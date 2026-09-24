import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createClient } from "@libsql/client";

const scrypt = promisify(scryptCallback);
const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is required on Vercel");
}

export const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
let initialization: Promise<void> | undefined;

export function ready() {
  initialization ??= (async () => {
    await db.execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('citizen', 'responder', 'admin')))");
    await db.execute("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL)");
    await db.execute("CREATE TABLE IF NOT EXISTS login_attempts (phone_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, last_attempt INTEGER NOT NULL)");
  })().catch((error) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, "");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [method, saltHex, hashHex] = stored.split(":");
  if (method !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
