import { z } from "zod";

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const orgIdRegex = /^[a-zA-Z0-9]{1,6}$/;

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name is required").max(100),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(50)
    .regex(slugRegex, "Slug can only contain lowercase letters, numbers and hyphens"),
  orgId: z
    .union([z.string().regex(orgIdRegex, "Org ID can be letters/numbers, up to 6 characters"), z.literal("")])
    .optional()
    .default(""),
  phone: z.string().min(6, "Phone number is required").max(20),
  email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional().default(""),
  status: z.enum(["active", "suspended"]),
  // Theme is entirely optional at creation time — it's totally up to the org admin
  // to configure their own branding later from the Theme page.
  themeColor: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const orgAdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const paymentAccountSchema = z.object({
  // Display name is derived from the bank name automatically — not a separate
  // field the org admin has to fill in — but kept here so older records and
  // internal lookups keep working.
  accountName: z.string().optional().default(""),
  accountType: z.enum(["savings", "current", "salary", "other"]).default("savings"),
  bankName: z.string().min(2, "Bank name is required"),
  branch: z.string().optional().default(""),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(4, "Account number is required"),
  ifsc: z.string().optional().default(""),
  upiId: z.string().optional().default(""),
  qrImageUrl: z.string().optional().default(""),
  description: z.string().optional().default(""),
  priority: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "inactive", "archived"]),
  tags: z.array(z.string()).default([]),
  visibleToClients: z.boolean().default(true),
});
export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;

export const landingPageSchema = z.object({
  logoUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  heading: z.string().min(1),
  subHeading: z.string().optional().default(""),
  description: z.string().optional().default(""),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  buttonText: z.string().min(1),
  footerText: z.string().optional().default(""),
  supportPhone: z.string().optional().default(""),
  supportEmail: z.string().optional().default(""),
  address: z.string().optional().default(""),
  website: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  faviconUrl: z.string().optional().default(""),
});

export const themeSchema = z.object({
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  background: z.string().min(4),
  cardRadius: z.coerce.number().min(0).max(32),
  font: z.string().min(1),
  logoUrl: z.string().optional().default(""),
  mode: z.enum(["light", "dark"]),
});
