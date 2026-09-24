import assert from "node:assert/strict";
import test from "node:test";

process.env.TURSO_DATABASE_URL = "file::memory:";
const { handleAuth } = await import("../api/auth.ts");
const { db } = await import("./auth.ts");

function request(action: string, values?: Record<string, string>, cookie?: string) {
  return new Request("http://localhost:3001/api/auth", {
    method: "POST",
    headers: { Origin: "http://localhost:3001", "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ action, values }),
  });
}

test("registration, role, session, login throttling, and logout", async () => {
  const values = { fullName: "Fatima Bello", phone: "0803 123 4567", password: "securepass1", confirmPassword: "securepass1" };
  const registered = await handleAuth(request("register", values));
  assert.equal(registered.status, 200);
  assert.equal((await registered.json()).user.name, "Fatima Bello");
  const cookie = registered.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await handleAuth(new Request("http://localhost:3001/api/auth", { headers: { Cookie: cookie } }))).status, 200);
  assert.equal((await handleAuth(request("register", values))).status, 409);

  await db.execute({ sql: "UPDATE users SET role = 'admin' WHERE phone = ?", args: ["08031234567"] });
  const signedIn = await handleAuth(request("login", { ...values, password: "securepass1" }));
  assert.equal((await signedIn.json()).user.role, "admin");
  assert.equal((await handleAuth(request("logout", undefined, cookie))).status, 200);
  assert.equal((await handleAuth(new Request("http://localhost:3001/api/auth", { headers: { Cookie: cookie } }))).status, 401);

  for (let i = 0; i < 5; i++) assert.equal((await handleAuth(request("login", { ...values, password: "wrongpass" }))).status, 401);
  assert.equal((await handleAuth(request("login", { ...values, password: "securepass1" }))).status, 429);
  assert.equal((await handleAuth(new Request("http://localhost:3001/api/auth", { method: "POST", body: "{}" }))).status, 403);
  db.close();
});
