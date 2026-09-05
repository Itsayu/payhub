import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { StorageAdapter } from "./adapter";
import { Organization, SuperAdmin } from "@/lib/types";

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
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    
    const { data, error } = await this.client
      .from("super_admins")
      .select("id, email, password_hash, created_at")
      .ilike("email", cleanEmail)
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

  async getSuperAdminById(id: string): Promise<SuperAdmin | null> {
    if (!id) return null;
    const { data, error } = await this.client
      .from("super_admins")
      .select("id, email, password_hash, created_at")
      .eq("id", id)
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
      email: admin.email.toLowerCase().trim(),
      password_hash: admin.passwordHash,
      created_at: admin.createdAt,
    });
    if (error) throw new Error(`Supabase: failed to create super admin — ${error.message}`);
    return admin;
  }

  async updateSuperAdminPassword(id: string, newPasswordHash: string): Promise<void> {
    const { error } = await this.client
      .from("super_admins")
      .update({ password_hash: newPasswordHash })
      .eq("id", id);
    if (error) throw new Error(`Supabase: failed to update password — ${error.message}`);
  }

  async updateSuperAdminProfile(id: string, email: string): Promise<void> {
    const { error } = await this.client
      .from("super_admins")
      .update({ email: email.toLowerCase().trim() })
      .eq("id", id);
    if (error) throw new Error(`Supabase: failed to update super admin profile — ${error.message}`);
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