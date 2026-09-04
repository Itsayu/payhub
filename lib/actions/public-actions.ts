"use server";

import { getStorage } from "@/lib/storage";
import { trackEvent, pickRandomActiveAccount } from "@/lib/services/org-service";
import { getSession } from "@/lib/services/session";

export async function getRandomAccountAction(orgSlug: string, excludeId?: string, visitorId?: string) {
  const org = await getStorage().getOrganizationBySlug(orgSlug);
  if (!org || org.status !== "active") return { success: false as const, error: "Not available" };

  const account = pickRandomActiveAccount(org.accounts, excludeId);
  if (!account) return { success: false as const, error: "No active payment accounts" };

  await trackEvent(orgSlug, {
    type: excludeId ? "show_another" : "public_visit",
    accountId: account.id,
    visitorId: visitorId ?? "anonymous",
  });
  await trackEvent(orgSlug, {
    type: "account_shown",
    accountId: account.id,
    visitorId: visitorId ?? "anonymous",
  });

  return {
    success: true as const,
    account,
    org: { name: org.name, logoUrl: org.logoUrl, landing: org.landing },
  };
}

export async function trackCopyAction(orgSlug: string, accountId: string, field: string, visitorId?: string) {
  await trackEvent(orgSlug, {
    type: "field_copied",
    accountId,
    field,
    visitorId: visitorId ?? "anonymous",
  });
  return { success: true };
}

export async function trackQrViewAction(orgSlug: string, accountId: string, visitorId?: string) {
  await trackEvent(orgSlug, { type: "qr_view", accountId, visitorId: visitorId ?? "anonymous" });
  return { success: true };
}

/** Handles logo/QR image uploads for the currently authenticated org admin. */
export async function uploadOrgFileAction(orgSlug: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "org_admin" || session.orgSlug !== orgSlug) {
    return { success: false as const, error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { success: false as const, error: "No file provided" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await getStorage().saveUploadedFile(orgSlug, fileName, bytes);

  return { success: true as const, url };
}
