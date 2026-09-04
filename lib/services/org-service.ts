import { getStorage } from "@/lib/storage";
import { Organization, PaymentAccount, AnalyticsEvent } from "@/lib/types";
import { CreateOrganizationInput } from "@/lib/schemas";
import {
  generateOrgId,
  generateAdminUsername,
  generateTempPassword,
  hashPassword,
  normalizeOrgId,
} from "./credentials";
import { defaultLandingContent, defaultTheme } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_THEME_COLORS = ["#6D28D9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];

export async function listOrganizations(): Promise<Organization[]> {
  return getStorage().listOrganizations();
}

export async function getOrganization(slug: string): Promise<Organization | null> {
  return getStorage().getOrganizationBySlug(slug);
}

/**
 * Looks up which organization an org-admin username belongs to. Used by the
 * universal "/admin" login so an org admin can sign in with just their
 * username and password, without needing to know or type their org slug.
 */
export async function findOrganizationByAdminUsername(username: string): Promise<Organization | null> {
  const orgs = await getStorage().listOrganizations();
  const target = username.trim().toLowerCase();
  return orgs.find((o) => o.admin.username.toLowerCase() === target) ?? null;
}

export interface CreatedOrgCredentials {
  organizationId: string;
  slug: string;
  loginUrl: string;
  username: string;
  userId: string;
  temporaryPassword: string;
}

export async function createOrganization(
  input: CreateOrganizationInput,
  appUrl: string
): Promise<CreatedOrgCredentials> {
  const storage = getStorage();

  const existing = await storage.getOrganizationBySlug(input.slug);
  if (existing) {
    throw new Error(`Slug "${input.slug}" is already taken`);
  }

  const now = new Date().toISOString();

  // Org ID: either a custom string/number/combination (max 6 chars) supplied by the
  // super admin, or an auto-generated one. Either way it must be unique.
  let orgId: string;
  if (input.orgId && input.orgId.trim()) {
    orgId = normalizeOrgId(input.orgId);
    if (await storage.getOrganizationById(orgId)) {
      throw new Error(`Org ID "${orgId}" is already in use`);
    }
  } else {
    orgId = generateOrgId();
    let attempts = 0;
    while (await storage.getOrganizationById(orgId)) {
      orgId = generateOrgId();
      attempts += 1;
      if (attempts > 20) throw new Error("Could not generate a unique organization ID, please try again");
    }
  }

  // Admin username must be unique across every organization.
  const allOrgs = await storage.listOrganizations();
  const takenUsernames = new Set(allOrgs.map((o) => o.admin.username));
  let usernameAttempts = 0;
  let username = generateAdminUsername(orgId, input.slug, usernameAttempts);
  while (takenUsernames.has(username)) {
    usernameAttempts += 1;
    if (usernameAttempts > 20) throw new Error("Could not generate a unique admin username, please try again");
    username = generateAdminUsername(orgId, input.slug, usernameAttempts);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const adminId = uuidv4();
  // Theme color is fully optional at creation time — the org admin can set/change
  // their own branding later from the Theme page. Fall back to a pleasant default.
  const themeColor = input.themeColor?.trim() || DEFAULT_THEME_COLORS[orgId.charCodeAt(0) % DEFAULT_THEME_COLORS.length];

  const org: Organization = {
    id: orgId,
    name: input.name,
    slug: input.slug,
    phone: input.phone,
    email: input.email,
    status: input.status,
    themeColor,
    logoUrl: input.logoUrl ?? "",
    createdAt: now,
    updatedAt: now,
    admin: {
      id: adminId,
      username,
      passwordHash,
      forcePasswordChange: true,
      createdAt: now,
      updatedAt: now,
    },
    landing: defaultLandingContent(input.name, themeColor),
    theme: defaultTheme(themeColor),
    accounts: [],
    analytics: [],
  };

  await storage.createOrganization(org);

  return {
    organizationId: orgId,
    slug: input.slug,
    loginUrl: `${appUrl}/admin`,
    username,
    userId: adminId,
    temporaryPassword: tempPassword,
  };
}

export async function suspendOrganization(slug: string) {
  return getStorage().updateOrganization(slug, (org) => ({ ...org, status: "suspended" }));
}

export async function activateOrganization(slug: string) {
  return getStorage().updateOrganization(slug, (org) => ({ ...org, status: "active" }));
}

export async function deleteOrganization(slug: string) {
  return getStorage().deleteOrganization(slug);
}

export interface UpdateOrganizationDetailsInput {
  name: string;
  phone: string;
  email: string;
  status: "active" | "suspended";
}

/** Edits an organization's core details from the super-admin console (name, phone, email, status). */
export async function updateOrganizationDetails(slug: string, data: UpdateOrganizationDetailsInput) {
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    name: data.name,
    phone: data.phone,
    email: data.email,
    status: data.status,
    updatedAt: new Date().toISOString(),
  }));
}

export async function resetOrgAdminPassword(
  slug: string,
  appUrl: string
): Promise<{ tempPassword: string; username: string; userId: string; orgId: string; loginUrl: string }> {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const updated = await getStorage().updateOrganization(slug, (org) => ({
    ...org,
    admin: {
      ...org.admin,
      passwordHash,
      forcePasswordChange: true,
      updatedAt: new Date().toISOString(),
    },
  }));
  return {
    tempPassword,
    username: updated.admin.username,
    userId: updated.admin.id,
    orgId: updated.id,
    loginUrl: `${appUrl}/admin`,
  };
}

export async function setOrgAdminPassword(slug: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    admin: {
      ...org.admin,
      passwordHash,
      forcePasswordChange: false,
      updatedAt: new Date().toISOString(),
    },
  }));
}

// ---------- Payment accounts ----------

export async function addPaymentAccount(
  slug: string,
  data: Omit<PaymentAccount, "id" | "createdAt" | "updatedAt">
): Promise<Organization> {
  const now = new Date().toISOString();
  const account: PaymentAccount = {
    ...data,
    accountName: data.accountName?.trim() || data.bankName,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    accounts: [...org.accounts, account],
  }));
}

export async function updatePaymentAccount(
  slug: string,
  accountId: string,
  data: Partial<Omit<PaymentAccount, "id" | "createdAt">>
): Promise<Organization> {
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    accounts: org.accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            ...data,
            accountName: data.accountName?.trim() || data.bankName?.trim() || a.accountName,
            updatedAt: new Date().toISOString(),
          }
        : a
    ),
  }));
}

export async function deletePaymentAccount(slug: string, accountId: string): Promise<Organization> {
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    accounts: org.accounts.filter((a) => a.id !== accountId),
  }));
}

export async function duplicatePaymentAccount(slug: string, accountId: string): Promise<Organization> {
  const now = new Date().toISOString();
  return getStorage().updateOrganization(slug, (org) => {
    const source = org.accounts.find((a) => a.id === accountId);
    if (!source) return org;
    const copy: PaymentAccount = {
      ...source,
      id: uuidv4(),
      accountName: `${source.accountName} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    return { ...org, accounts: [...org.accounts, copy] };
  });
}

export async function bulkUpdateAccountStatus(
  slug: string,
  accountIds: string[],
  status: PaymentAccount["status"]
): Promise<Organization> {
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    accounts: org.accounts.map((a) =>
      accountIds.includes(a.id) ? { ...a, status, updatedAt: new Date().toISOString() } : a
    ),
  }));
}

export async function bulkDeleteAccounts(slug: string, accountIds: string[]): Promise<Organization> {
  return getStorage().updateOrganization(slug, (org) => ({
    ...org,
    accounts: org.accounts.filter((a) => !accountIds.includes(a.id)),
  }));
}

// ---------- Landing / theme ----------

export async function updateLandingContent(slug: string, data: Organization["landing"]) {
  return getStorage().updateOrganization(slug, (org) => ({ ...org, landing: data }));
}

export async function updateThemeSettings(slug: string, data: Organization["theme"]) {
  return getStorage().updateOrganization(slug, (org) => ({ ...org, theme: data }));
}

// ---------- Analytics ----------

export async function trackEvent(
  slug: string,
  event: Omit<AnalyticsEvent, "id" | "createdAt">
): Promise<void> {
  const entry: AnalyticsEvent = { ...event, id: uuidv4(), createdAt: new Date().toISOString() };
  await getStorage().updateOrganization(slug, (org) => ({
    ...org,
    analytics: [...org.analytics, entry].slice(-5000), // cap history
  }));
}

/** Picks one random ACTIVE account, excluding a given id if possible (for "show another"). */
export function pickRandomActiveAccount(
  accounts: PaymentAccount[],
  excludeId?: string
): PaymentAccount | null {
  const active = accounts.filter((a) => a.status === "active" && a.visibleToClients !== false);
  if (active.length === 0) return null;
  const pool = active.length > 1 && excludeId ? active.filter((a) => a.id !== excludeId) : active;
  const chosen = pool.length > 0 ? pool : active;
  return chosen[Math.floor(Math.random() * chosen.length)];
}
