/**
 * Seed script — creates demo data:
 *   Super Admin:  ayush@admin.com / Admin@123
 *   Acme Traders  (slug: acme,        org id ACME01, password: Temp@123)
 *   Bright School (slug: bright,      org id BRIT02, password: Temp@123)
 *   Modern Mart   (slug: modern-mart, org id MODR03, password: Temp@123)
 *
 * Usernames are generated the same way real organizations get theirs
 * (see lib/services/credentials.ts#generateAdminUsername): the first three
 * characters of the org id, the letter "a", then the first four characters
 * of the slug — e.g. org id "ACME01" + slug "acme" -> "acmaacme".
 *
 * Goes through the same getStorage() abstraction as the rest of the app, so
 * it seeds whichever backend is active — set STORAGE_MODE=json (default) or
 * STORAGE_MODE=supabase in .env.local before running. Safe to re-run: existing
 * demo orgs/super admin are left as-is rather than erroring.
 *
 * Run with: npm run seed
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Organization, SuperAdmin } from "../lib/types";
import { defaultLandingContent, defaultTheme } from "../lib/utils";
import { generateAdminUsername } from "../lib/services/credentials";
import { getStorage } from "../lib/storage";

// --- Minimal .env.local / .env loader (mirrors scripts/create-super-admin.ts) ---
// Needed because this runs via `tsx` outside the Next.js runtime, which is
// what normally loads .env.local automatically.
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

async function seedSuperAdmin() {
  const storage = getStorage();
  const email = "ayush@admin.com";
  const existing = await storage.getSuperAdminByEmail(email);
  if (existing) {
    console.log(`↷ Super Admin already exists — ${email} / Admin@123 (unchanged)`);
    return;
  }
  const admin: SuperAdmin = {
    id: uuidv4(),
    email,
    passwordHash: await bcrypt.hash("Admin@123", 10),
    createdAt: new Date().toISOString(),
  };
  await storage.createSuperAdmin(admin);
  console.log("✓ Super Admin created — ayush@admin.com / Admin@123");
}

interface DemoOrgSpec {
  name: string;
  slug: string;
  orgId: string;
  phone: string;
  email: string;
  themeColor: string;
  accounts: { accountName: string; accountType: "savings" | "current"; bankName: string; accountHolderName: string; accountNumber: string; ifsc: string; upiId: string; priority: number }[];
}

const demoOrgs: DemoOrgSpec[] = [
  {
    name: "Acme Traders",
    slug: "acme",
    orgId: "ACME01",
    phone: "+1 555 010 2020",
    email: "contact@acmetraders.com",
    themeColor: "#6D28D9",
    accounts: [
      { accountName: "Primary Business Account", accountType: "current", bankName: "First National Bank", accountHolderName: "Acme Traders LLC", accountNumber: "1234567890123", ifsc: "FNB0001122", upiId: "acmetraders@upi", priority: 3 },
      { accountName: "Secondary Account", accountType: "savings", bankName: "Union Bank", accountHolderName: "Acme Traders LLC", accountNumber: "9988776655443", ifsc: "UNB0004455", upiId: "acme2@upi", priority: 1 },
    ],
  },
  {
    name: "Bright School",
    slug: "bright",
    orgId: "BRIT02",
    phone: "+1 555 020 3030",
    email: "accounts@brightschool.edu",
    themeColor: "#0EA5E9",
    accounts: [
      { accountName: "School Fees Account", accountType: "current", bankName: "City Trust Bank", accountHolderName: "Bright School Trust", accountNumber: "5566778899001", ifsc: "CTB0002233", upiId: "brightschool@upi", priority: 2 },
    ],
  },
  {
    name: "Modern Mart",
    slug: "modern-mart",
    orgId: "MODR03",
    phone: "+1 555 030 4040",
    email: "billing@modernmart.com",
    themeColor: "#10B981",
    accounts: [
      { accountName: "Store Collections", accountType: "current", bankName: "Metro Commercial Bank", accountHolderName: "Modern Mart Pvt Ltd", accountNumber: "1122334455667", ifsc: "MCB0003344", upiId: "modernmart@upi", priority: 2 },
      { accountName: "Online Orders", accountType: "savings", bankName: "Metro Commercial Bank", accountHolderName: "Modern Mart Pvt Ltd", accountNumber: "7788990011223", ifsc: "MCB0003344", upiId: "modernmart.online@upi", priority: 1 },
    ],
  },
];

async function seedOrganizations() {
  const storage = getStorage();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash("Temp@123", 10);

  for (const spec of demoOrgs) {
    const existing = await storage.getOrganizationBySlug(spec.slug);
    const username = generateAdminUsername(spec.orgId, spec.slug);
    if (existing) {
      console.log(`↷ Organization already exists — ${spec.name} (/${spec.slug}) — ${existing.admin.username} / Temp@123 (unchanged)`);
      continue;
    }

    const org: Organization = {
      id: spec.orgId,
      name: spec.name,
      slug: spec.slug,
      phone: spec.phone,
      email: spec.email,
      status: "active",
      themeColor: spec.themeColor,
      logoUrl: "",
      createdAt: now,
      updatedAt: now,
      admin: {
        id: uuidv4(),
        username,
        passwordHash,
        // Demo orgs skip the forced first-login password change so anyone
        // trying the demo account can go straight to the dashboard.
        forcePasswordChange: false,
        createdAt: now,
        updatedAt: now,
      },
      landing: defaultLandingContent(spec.name, spec.themeColor),
      theme: defaultTheme(spec.themeColor),
      accounts: spec.accounts.map((a) => ({
        id: uuidv4(),
        accountName: a.accountName,
        accountType: a.accountType,
        bankName: a.bankName,
        branch: "Main Branch",
        accountHolderName: a.accountHolderName,
        accountNumber: a.accountNumber,
        ifsc: a.ifsc,
        upiId: a.upiId,
        qrImageUrl: "",
        description: "Verified payment account",
        priority: a.priority,
        status: "active",
        tags: ["verified"],
        visibleToClients: true,
        createdAt: now,
        updatedAt: now,
      })),
      analytics: [],
    };

    await storage.createOrganization(org);
    console.log(`✓ Organization created — ${spec.name} (/${spec.slug}) — ${username} / Temp@123`);
  }
}

async function main() {
  const mode = process.env.STORAGE_MODE ?? "json";
  console.log(`Seeding payhub SaaS demo data (STORAGE_MODE=${mode})...\n`);
  await seedSuperAdmin();
  await seedOrganizations();
  const demoUsername = generateAdminUsername(demoOrgs[0].orgId, demoOrgs[0].slug);
  console.log("\nDone! Start the app with `npm run dev` and try:");
  console.log("  Super Admin login: /super-admin/login  (ayush@admin.com / Admin@123)");
  console.log(`  Org Admin login:   /admin  (username: ${demoUsername}, password: Temp@123)`);
  console.log("  ...or any of: acmaacme / briabrig / modamode  (all password: Temp@123)");
  console.log("  Public page:       /acme");
  console.log("  Payment page:      /acme/user");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
