// ---------- Shared domain types for payhub SaaS ----------

export type OrgStatus = "active" | "suspended";
export type AccountStatus = "active" | "inactive" | "archived";
export type UserRole = "super_admin" | "org_admin";
export type BankAccountType = "savings" | "current" | "salary" | "other";

export interface SuperAdmin {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface OrgAdminUser {
  id: string;
  username: string;
  passwordHash: string;
  forcePasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageContent {
  logoUrl: string;
  bannerUrl: string;
  heading: string;
  subHeading: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  buttonText: string;
  footerText: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  website: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  seoTitle: string;
  seoDescription: string;
  faviconUrl: string;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  background: string;
  cardRadius: number;
  font: string;
  logoUrl: string;
  mode: "light" | "dark";
}

export interface PaymentAccount {
  id: string;
  accountName: string;
  accountType: BankAccountType;
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  qrImageUrl: string;
  description: string;
  priority: number;
  status: AccountStatus;
  tags: string[];
  visibleToClients: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type:
    | "public_visit"
    | "account_shown"
    | "field_copied"
    | "qr_view"
    | "show_another";
  accountId?: string;
  field?: string;
  visitorId: string;
  createdAt: string;
}

export interface Organization {
  id: string; // e.g. ORG-10021
  name: string;
  slug: string;
  phone: string;
  email: string;
  status: OrgStatus;
  themeColor: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
  admin: OrgAdminUser;
  landing: LandingPageContent;
  theme: ThemeSettings;
  accounts: PaymentAccount[];
  analytics: AnalyticsEvent[];
}

export interface SessionPayload {
  role: UserRole;
  id: string; // super admin id or org admin user id
  email?: string;
  orgSlug?: string; // present for org_admin
  forcePasswordChange?: boolean;
}
