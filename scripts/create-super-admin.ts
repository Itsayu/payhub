/**
 * Creates (or resets) the one super-admin login for the platform.
 *
 * Works against whichever backend is configured in .env.local:
 *   STORAGE_MODE=json      -> writes data/super-admin.json (local dev)
 *   STORAGE_MODE=supabase  -> upserts a row into the super_admins table
 *
 * Usage:
 *   npm run create-admin -- you@company.com "SomeStrongPassword123"
 *   npm run create-admin                       (prompts for defaults)
 */
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// --- Minimal .env.local / .env loader (no extra dependency needed) ---
function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  const email = emailArg ?? "ayush@admin.com";
  const password = passwordArg ?? "Admin@123";

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const mode = process.env.STORAGE_MODE ?? "json";

  if (mode === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error(
        "STORAGE_MODE=supabase but NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing from .env.local."
      );
      process.exit(1);
    }
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url, key, { auth: { persistSession: false } });

    const { data: existing } = await client
      .from("super_admins")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existing) {
      const { error } = await client
        .from("super_admins")
        .update({ password_hash: passwordHash })
        .eq("id", existing.id);
      if (error) throw error;
      console.log(`Updated password for existing super admin "${email}" in Supabase.`);
    } else {
      const { error } = await client.from("super_admins").insert({
        id: uuidv4(),
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      console.log(`Created super admin "${email}" in Supabase.`);
    }
  } else {
    const filePath = path.join(process.cwd(), "data", "super-admin.json");
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    const admin = {
      id: uuidv4(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await fsp.writeFile(filePath, JSON.stringify(admin, null, 2));
    console.log(`Wrote super admin "${email}" to ${filePath}.`);
  }

  console.log("\nLogin with:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
