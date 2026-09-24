import { randomBytes, randomUUID } from "node:crypto";
import { db, hashPassword, hashToken, normalizePhone, ready, verifyPassword } from "../server/auth.ts";
import { validateAuth, type AuthValues } from "../src/validation.ts";

type User = { id: string; name: string; phone: string; role: "citizen" | "responder" | "admin" };
const COOKIE = "rapidaid_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const headers = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200, cookie?: string) {
  return Response.json(body, { status, headers: { ...headers, ...(cookie ? { "Set-Cookie": cookie } : {}) } });
}

function sessionCookie(token: string, request: Request, age = SESSION_SECONDS) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure}`;
}

function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
}

async function currentUser(request: Request): Promise<User | null> {
  const token = sessionToken(request);
  if (!token) return null;
  const result = await db.execute({
    sql: "SELECT users.id, users.name, users.phone, users.role FROM users JOIN sessions ON sessions.user_id = users.id WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
    args: [hashToken(token), Date.now()],
  });
  const row = result.rows[0];
  return row ? { id: String(row.id), name: String(row.name), phone: String(row.phone), role: row.role as User["role"] } : null;
}

async function issueSession(request: Request, user: User) {
  const token = randomBytes(32).toString("hex");
  await db.execute({ sql: "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", args: [hashToken(token), user.id, Date.now() + SESSION_SECONDS * 1000] });
  return json({ user }, 200, sessionCookie(token, request));
}

export async function handleAuth(request: Request): Promise<Response> {
  try {
    await ready();
    if (request.method === "GET") {
      const user = await currentUser(request);
      return user ? json({ user }) : json({ error: "Not signed in" }, 401);
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid origin" }, 403);
    if (Number(request.headers.get("content-length") || 0) > 4096) return json({ error: "Request too large" }, 413);

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid request" }, 400);
    if (body.action === "logout") {
      const token = sessionToken(request);
      if (token) await db.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hashToken(token)] });
      return json({ ok: true }, 200, sessionCookie("", request, 0));
    }
    if (body.action !== "login" && body.action !== "register") return json({ error: "Invalid action" }, 400);
    const values = body.values as AuthValues | undefined;
    if (!values || typeof values.phone !== "string" || typeof values.password !== "string" ||
      typeof values.fullName !== "string" || typeof values.confirmPassword !== "string") return json({ error: "Invalid fields" }, 400);
    const errors = validateAuth(body.action, values);
    if (values.fullName.length > 100 || values.password.length > 128) return json({ error: "Fields are too long" }, 400);
    if (Object.keys(errors).length) return json({ errors }, 400);
    const phone = normalizePhone(values.phone);

    if (body.action === "register") {
      const existing = await db.execute({ sql: "SELECT id FROM users WHERE phone = ?", args: [phone] });
      if (existing.rows.length) return json({ error: "Phone number already registered" }, 409);
      const user: User = { id: randomUUID(), name: values.fullName.trim(), phone, role: "citizen" };
      try {
        await db.execute({ sql: "INSERT INTO users (id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)", args: [user.id, user.name, phone, await hashPassword(values.password), user.role] });
      } catch (error) {
        if (String(error).includes("UNIQUE")) return json({ error: "Phone number already registered" }, 409);
        throw error;
      }
      return issueSession(request, user);
    }

    const phoneHash = hashToken(phone);
    const attempt = await db.execute({ sql: "SELECT count, last_attempt FROM login_attempts WHERE phone_hash = ?", args: [phoneHash] });
    const previous = attempt.rows[0];
    if (previous && Number(previous.count) >= 5 && Date.now() - Number(previous.last_attempt) < 15 * 60 * 1000) {
      return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    }
    const result = await db.execute({ sql: "SELECT id, name, phone, role, password_hash FROM users WHERE phone = ?", args: [phone] });
    const row = result.rows[0];
    if (!row || !(await verifyPassword(values.password, String(row.password_hash)))) {
      await db.execute({ sql: "INSERT INTO login_attempts (phone_hash, count, last_attempt) VALUES (?, 1, ?) ON CONFLICT(phone_hash) DO UPDATE SET count = CASE WHEN last_attempt < ? THEN 1 ELSE count + 1 END, last_attempt = excluded.last_attempt", args: [phoneHash, Date.now(), Date.now() - 15 * 60 * 1000] });
      return json({ error: "Incorrect phone number or password" }, 401);
    }
    await db.execute({ sql: "DELETE FROM login_attempts WHERE phone_hash = ?", args: [phoneHash] });
    return issueSession(request, { id: String(row.id), name: String(row.name), phone: String(row.phone), role: row.role as User["role"] });
  } catch (error) {
    console.error("Authentication error", error);
    return json({ error: "Authentication is temporarily unavailable" }, 500);
  }
}

export default { fetch: handleAuth };
