"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  createOrganizationSchema,
  superAdminLoginSchema,
  CreateOrganizationInput,
} from "@/lib/schemas";
import { getStorage } from "@/lib/storage";
import {
  createOrganization,
  suspendOrganization,
  activateOrganization,
  deleteOrganization,
  resetOrgAdminPassword,
  updateOrganizationDetails,
  UpdateOrganizationDetailsInput,
} from "@/lib/services/org-service";
import { loginSuperAdmin, logout, requireSuperAdmin, changeSuperAdminPassword } from "@/lib/services/auth-service";

export async function superAdminLoginAction(formData: FormData) {
  const parsed = superAdminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  return loginSuperAdmin(parsed.data.email, parsed.data.password);
}

export async function superAdminLogoutAction() {
  await logout();
}

async function getAppUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  return process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;
}

export async function createOrganizationAction(input: CreateOrganizationInput) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const appUrl = await getAppUrl();
    const credentials = await createOrganization(parsed.data, appUrl);
    revalidatePath("/super-admin");
    return { success: true as const, credentials };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : "Failed to create organization" };
  }
}

export async function suspendOrganizationAction(slug: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: "Unauthorized" };
  await suspendOrganization(slug);
  revalidatePath("/super-admin");
  return { success: true };
}

export async function activateOrganizationAction(slug: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: "Unauthorized" };
  await activateOrganization(slug);
  revalidatePath("/super-admin");
  return { success: true };
}

export async function deleteOrganizationAction(slug: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: "Unauthorized" };
  await deleteOrganization(slug);
  revalidatePath("/super-admin");
  return { success: true };
}

export async function updateOrganizationAction(slug: string, input: UpdateOrganizationDetailsInput) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();
  if (name.length < 2) return { success: false as const, error: "Organization name is required" };
  if (phone.length < 6) return { success: false as const, error: "Phone number is required" };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { success: false as const, error: "Enter a valid email" };
  if (input.status !== "active" && input.status !== "suspended") {
    return { success: false as const, error: "Invalid status" };
  }

  try {
    await updateOrganizationDetails(slug, { name, phone, email, status: input.status });
    revalidatePath("/super-admin");
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : "Failed to update organization" };
  }
}

export async function resetOrgPasswordAction(slug: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: "Unauthorized" };
  const appUrl = await getAppUrl();
  const result = await resetOrgAdminPassword(slug, appUrl);
  revalidatePath("/super-admin");
  return { success: true as const, ...result };
}

export async function changeSuperAdminPasswordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  if (!session) {
    return { success: false as const, error: "Unauthorized session" };
  }

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false as const, error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false as const, error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { success: false as const, error: "New password must be at least 8 characters long" };
  }

  try {
    // Pass session.email if present, otherwise pass session.id
    const identifier = session.email || session.id;
    return await changeSuperAdminPassword(identifier, currentPassword, newPassword);
  } catch (e) {
    return { success: false as const, error: e instanceof Error ? e.message : "Failed to update password" };
  }
}