"use server";

import { revalidatePath } from "next/cache";
import {
  orgAdminLoginSchema,
  changePasswordSchema,
  paymentAccountSchema,
  landingPageSchema,
  themeSchema,
  PaymentAccountInput,
} from "@/lib/schemas";
import { loginOrgAdmin, loginOrgAdminByUsername, logout, requireOrgAdmin } from "@/lib/services/auth-service";
import { createSession, getSession } from "@/lib/services/session";
import {
  addPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  duplicatePaymentAccount,
  bulkUpdateAccountStatus,
  bulkDeleteAccounts,
  updateLandingContent,
  updateThemeSettings,
  setOrgAdminPassword,
} from "@/lib/services/org-service";
import { Organization } from "@/lib/types";

export async function orgAdminLoginAction(orgSlug: string, formData: FormData) {
  const parsed = orgAdminLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  return loginOrgAdmin(orgSlug, parsed.data.username, parsed.data.password);
}

/**
 * Handles login from the shared "/admin" page. The org admin only enters
 * their username and password — the org is resolved from the username itself
 * (see generateAdminUsername), then they're auto-redirected to their own
 * `/{slug}/admin` dashboard by the caller.
 */
export async function orgAdminUniversalLoginAction(formData: FormData) {
  const parsed = orgAdminLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  return loginOrgAdminByUsername(parsed.data.username, parsed.data.password);
}

export async function orgAdminLogoutAction() {
  await logout();
}

export async function changeOrgAdminPasswordAction(orgSlug: string, formData: FormData) {
  const session = await requireOrgAdmin(orgSlug);
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  await setOrgAdminPassword(orgSlug, parsed.data.newPassword);

  // The JWT in the cookie still carries the old forcePasswordChange: true flag,
  // which would make the middleware bounce the user straight back to this page.
  // Re-issue the session with the flag cleared so they land on the dashboard.
  await createSession({
    role: "org_admin",
    id: session.id,
    orgSlug,
    forcePasswordChange: false,
  });

  return { success: true };
}

async function assertAccess(orgSlug: string) {
  const session = await requireOrgAdmin(orgSlug);
  if (!session) throw new Error("Unauthorized");
}

export async function createAccountAction(orgSlug: string, input: PaymentAccountInput) {
  await assertAccess(orgSlug);
  const parsed = paymentAccountSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
  await addPaymentAccount(orgSlug, parsed.data);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function updateAccountAction(orgSlug: string, accountId: string, input: PaymentAccountInput) {
  await assertAccess(orgSlug);
  const parsed = paymentAccountSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
  await updatePaymentAccount(orgSlug, accountId, parsed.data);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function deleteAccountAction(orgSlug: string, accountId: string) {
  await assertAccess(orgSlug);
  await deletePaymentAccount(orgSlug, accountId);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function duplicateAccountAction(orgSlug: string, accountId: string) {
  await assertAccess(orgSlug);
  await duplicatePaymentAccount(orgSlug, accountId);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function bulkUpdateStatusAction(
  orgSlug: string,
  accountIds: string[],
  status: "active" | "inactive" | "archived"
) {
  await assertAccess(orgSlug);
  await bulkUpdateAccountStatus(orgSlug, accountIds, status);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function bulkDeleteAction(orgSlug: string, accountIds: string[]) {
  await assertAccess(orgSlug);
  await bulkDeleteAccounts(orgSlug, accountIds);
  revalidatePath(`/${orgSlug}/admin/accounts`);
  return { success: true };
}

export async function updateLandingAction(orgSlug: string, input: Organization["landing"]) {
  await assertAccess(orgSlug);
  const parsed = landingPageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
  await updateLandingContent(orgSlug, parsed.data);
  revalidatePath(`/${orgSlug}`);
  revalidatePath(`/${orgSlug}/admin/landing`);
  return { success: true };
}

export async function updateThemeAction(orgSlug: string, input: Organization["theme"]) {
  await assertAccess(orgSlug);
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };
  await updateThemeSettings(orgSlug, parsed.data);
  revalidatePath(`/${orgSlug}`);
  revalidatePath(`/${orgSlug}/admin/theme`);
  return { success: true };
}
