import { getStorage } from "@/lib/storage";
import { verifyPassword } from "./credentials";
import { createSession, destroySession, getSession } from "./session";
import { findOrganizationByAdminUsername } from "./org-service";

export async function loginSuperAdmin(email: string, password: string) {
  const admin = await getStorage().getSuperAdminByEmail(email);
  if (!admin) return { success: false as const, error: "Invalid email or password" };

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return { success: false as const, error: "Invalid email or password" };

  await createSession({ role: "super_admin", id: admin.id });
  return { success: true as const };
}

export async function loginOrgAdmin(orgSlug: string, username: string, password: string) {
  const org = await getStorage().getOrganizationBySlug(orgSlug);
  if (!org) return { success: false as const, error: "Organization not found" };
  if (org.status === "suspended") {
    return { success: false as const, error: "This organization has been suspended" };
  }
  if (org.admin.username.toLowerCase() !== username.toLowerCase()) {
    return { success: false as const, error: "Invalid username or password" };
  }

  const valid = await verifyPassword(password, org.admin.passwordHash);
  if (!valid) return { success: false as const, error: "Invalid username or password" };

  await createSession({
    role: "org_admin",
    id: org.admin.id,
    orgSlug,
    forcePasswordChange: org.admin.forcePasswordChange,
  });
  return { success: true as const, forcePasswordChange: org.admin.forcePasswordChange };
}

/**
 * Universal org-admin login used by the shared "/admin" page. The org admin
 * only provides their username and password (no org slug required) — we look
 * up which organization that username belongs to first, then authenticate
 * exactly like `loginOrgAdmin`. Returns the org's slug so the caller can
 * redirect the admin straight to their own dashboard.
 */
export async function loginOrgAdminByUsername(username: string, password: string) {
  const org = await findOrganizationByAdminUsername(username);
  if (!org) return { success: false as const, error: "Invalid username or password" };
  if (org.status === "suspended") {
    return { success: false as const, error: "This organization has been suspended" };
  }

  const valid = await verifyPassword(password, org.admin.passwordHash);
  if (!valid) return { success: false as const, error: "Invalid username or password" };

  await createSession({
    role: "org_admin",
    id: org.admin.id,
    orgSlug: org.slug,
    forcePasswordChange: org.admin.forcePasswordChange,
  });
  return { success: true as const, forcePasswordChange: org.admin.forcePasswordChange, orgSlug: org.slug };
}

export async function logout() {
  await destroySession();
}

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

export async function requireOrgAdmin(orgSlug: string) {
  const session = await getSession();
  if (!session || session.role !== "org_admin" || session.orgSlug !== orgSlug) return null;
  return session;
}
