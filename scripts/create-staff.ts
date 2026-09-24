import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";
import { db, hashPassword, normalizePhone, ready } from "../server/auth.ts";
import { validateAuth } from "../src/validation.ts";

const role = process.argv[2];
if (role !== "admin" && role !== "responder") {
  console.error("Usage: npm run staff:create -- admin|responder");
  process.exitCode = 1;
} else {
  let muted = false;
  const output = new Writable({ write(chunk, _encoding, done) { if (!muted) stdout.write(chunk); done(); } });
  const prompt = createInterface({ input: stdin, output, terminal: true });
  try {
    if (!stdin.isTTY) throw new Error("Run this command in an interactive terminal");
    const name = (await prompt.question("Full name: ")).trim();
    const phone = normalizePhone(await prompt.question("Phone number: "));
    await ready();
    const existing = await db.execute({ sql: "SELECT role FROM users WHERE phone = ?", args: [phone] });
    if (existing.rows.length) throw new Error(`This phone number already belongs to a ${existing.rows[0].role} account. Use a different number for ${role}.`);
    const passwordAnswer = prompt.question("Password: ");
    muted = true;
    const password = await passwordAnswer;
    muted = false;
    stdout.write("\n");
    const errors = validateAuth("register", { fullName: name, phone, password, confirmPassword: password });
    if (Object.keys(errors).length || name.length > 100 || password.length > 128) throw new Error(JSON.stringify(errors));
    await db.execute({ sql: "INSERT INTO users (id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)", args: [randomUUID(), name, phone, await hashPassword(password), role] });
    console.log(`${role} account created for ${name}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    muted = false;
    prompt.close();
    db.close();
  }
}
