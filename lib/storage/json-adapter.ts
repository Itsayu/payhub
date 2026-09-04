import fs from "fs/promises";
import path from "path";
import { StorageAdapter } from "./adapter";
import { Organization, SuperAdmin } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "organizations");
const SUPER_ADMIN_FILE = path.join(process.cwd(), "data", "super-admin.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Local-development storage adapter. Persists each organization as its own
 * JSON file at /data/organizations/{slug}.json, matching the spec so the
 * files are human-inspectable during development.
 */
export class JsonStorageAdapter implements StorageAdapter {
  private orgFilePath(slug: string) {
    return path.join(DATA_DIR, `${slug}.json`);
  }

  async listOrganizations(): Promise<Organization[]> {
    await ensureDir(DATA_DIR);
    const files = await fs.readdir(DATA_DIR);
    const orgs: Organization[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const org = await readJson<Organization>(path.join(DATA_DIR, file));
      if (org) orgs.push(org);
    }
    return orgs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    return readJson<Organization>(this.orgFilePath(slug));
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const orgs = await this.listOrganizations();
    return orgs.find((o) => o.id === id) ?? null;
  }

  async createOrganization(org: Organization): Promise<Organization> {
    await writeJson(this.orgFilePath(org.slug), org);
    await ensureDir(path.join(UPLOADS_DIR, org.slug));
    return org;
  }

  async updateOrganization(
    slug: string,
    updater: (org: Organization) => Organization
  ): Promise<Organization> {
    const existing = await this.getOrganizationBySlug(slug);
    if (!existing) throw new Error(`Organization "${slug}" not found`);
    const updated = updater(existing);
    updated.updatedAt = new Date().toISOString();
    await writeJson(this.orgFilePath(slug), updated);
    return updated;
  }

  async deleteOrganization(slug: string): Promise<void> {
    try {
      await fs.unlink(this.orgFilePath(slug));
    } catch {
      /* already gone */
    }
  }

  async getSuperAdminByEmail(email: string): Promise<SuperAdmin | null> {
    const admin = await readJson<SuperAdmin>(SUPER_ADMIN_FILE);
    if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) return null;
    return admin;
  }

  async createSuperAdmin(admin: SuperAdmin): Promise<SuperAdmin> {
    await writeJson(SUPER_ADMIN_FILE, admin);
    return admin;
  }

  async saveUploadedFile(orgSlug: string, fileName: string, buffer: Buffer): Promise<string> {
    const dir = path.join(UPLOADS_DIR, orgSlug);
    await ensureDir(dir);
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${orgSlug}/${fileName}`;
  }
}
