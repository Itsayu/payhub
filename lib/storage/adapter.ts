import { Organization, SuperAdmin } from "@/lib/types";

/**
 * StorageAdapter is the single abstraction every part of the app talks to.
 * Swapping STORAGE_MODE from "json" to "supabase" only requires implementing
 * this interface against Supabase (see storage/supabase-adapter.ts stub) —
 * no other application code needs to change.
 */
export interface StorageAdapter {
  // Organizations
  listOrganizations(): Promise<Organization[]>;
  getOrganizationBySlug(slug: string): Promise<Organization | null>;
  getOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: Organization): Promise<Organization>;
  updateOrganization(slug: string, updater: (org: Organization) => Organization): Promise<Organization>;
  deleteOrganization(slug: string): Promise<void>;

  // Super Admin
  getSuperAdminByEmail(email: string): Promise<SuperAdmin | null>;
  getSuperAdminById(id: string): Promise<SuperAdmin | null>;
  createSuperAdmin(admin: SuperAdmin): Promise<SuperAdmin>;
  updateSuperAdminPassword(id: string, newPasswordHash: string): Promise<void>;
  
  // File storage (logos, QR codes)
  saveUploadedFile(orgSlug: string, fileName: string, buffer: Buffer): Promise<string>; // returns public URL/path
}
