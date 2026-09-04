import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { StorageAdapter } from "./adapter";
import { Organization, SuperAdmin } from "@/lib/types";

/**
 * Production storage adapter backed by Supabase (Postgres + Storage).
 *
 * SETUP — this is the ONLY thing you need to do to switch the whole app
 * from local JSON files to Supabase:
 *   1. Create a Supabase project.
 *   2. Open the SQL editor and run supabase/migration.sql from this repo.
 *      It creates the `organizations` and `super_admins` tables plus a
 *      public "uploads" storage bucket.
 *   3. In Project Settings → API, copy the Project URL, anon key, and
 *      service_role key into .env.local (see .env.example).
 *   4. Set STORAGE_MODE=supabase in .env.local.
 *   5. Run `npm run create-admin` once to create your first super admin login.
 *
 * That's it — no code changes. Every page/action/component talks to
 * getStorage(), which returns this adapter once STORAGE_MODE=supabase.
 *
 * Each organization is stored as a single `data jsonb` column (mirroring
 * the Organization type exactly), with `id` and `slug` duplicated as plain
 * columns purely so Postgres can index/query on them directly.
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase storage mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment"
      );
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  async listOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.client
      .from("organizations")
      .select("data")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase: failed to list organizations — ${error.message}`);
    return (data ?? []).map((row) => row.data as Organization);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("data")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`Supabase: failed to fetch organization — ${error.message}`);
    return (data?.data as Organization) ?? null;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from("organizations")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase: failed to fetch organization — ${error.message}`);
    return (data?.data as Organization) ?? null;
  }

  async createOrganization(org: Organization): Promise<Organization> {
    const { error } = await this.client.from("organizations").insert({
      id: org.id,
      slug: org.slug,
      data: org,
      created_at: org.createdAt,
    });
    if (error) throw new Error(`Supabase: failed to create organization — ${error.message}`);
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
    const { error } = await this.client
      .from("organizations")
      .update({ data: updated, slug: updated.slug })
      .eq("slug", slug);
    if (error) throw new Error(`Supabase: failed to update organization — ${error.message}`);
    return updated;
  }

  async deleteOrganization(slug: string): Promise<void> {
    const { error } = await this.client.from("organizations").delete().eq("slug", slug);
    if (error) throw new Error(`Supabase: failed to delete organization — ${error.message}`);
  }

  async getSuperAdminByEmail(email: string): Promise<SuperAdmin | null> {
    const { data, error } = await this.client
      .from("super_admins")
      .select("id, email, password_hash, created_at")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw new Error(`Supabase: failed to fetch super admin — ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      createdAt: data.created_at,
    };
  }

  async createSuperAdmin(admin: SuperAdmin): Promise<SuperAdmin> {
    const { error } = await this.client.from("super_admins").insert({
      id: admin.id,
      email: admin.email,
      password_hash: admin.passwordHash,
      created_at: admin.createdAt,
    });
    if (error) throw new Error(`Supabase: failed to create super admin — ${error.message}`);
    return admin;
  }

  async saveUploadedFile(orgSlug: string, fileName: string, buffer: Buffer): Promise<string> {
    const filePath = `${orgSlug}/${fileName}`;
    const { error } = await this.client.storage.from("uploads").upload(filePath, buffer, {
      upsert: true,
    });
    if (error) throw new Error(`Supabase: failed to upload file — ${error.message}`);
    const { data } = this.client.storage.from("uploads").getPublicUrl(filePath);
    return data.publicUrl;
  }
}
