import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LandingPageContent, ThemeSettings } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function defaultLandingContent(orgName: string, themeColor: string): LandingPageContent {
  return {
    logoUrl: "",
    bannerUrl: "",
    heading: `Welcome to ${orgName}`,
    subHeading: "Fast, secure payments made simple",
    description: `${orgName} accepts payments through multiple verified accounts. Choose a payment method below and complete your transaction with confidence.`,
    primaryColor: themeColor,
    secondaryColor: themeColor,
    buttonText: "View Payment Details",
    footerText: `© ${new Date().getFullYear()} ${orgName}. All rights reserved.`,
    supportPhone: "",
    supportEmail: "",
    address: "",
    website: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    whatsapp: "",
    seoTitle: `${orgName} — Payments`,
    seoDescription: `Official payment page for ${orgName}`,
    faviconUrl: "",
  };
}

export function defaultTheme(themeColor: string): ThemeSettings {
  return {
    primaryColor: themeColor,
    secondaryColor: themeColor,
    background: "#FFFFFF",
    cardRadius: 16,
    font: "Inter",
    logoUrl: "",
    mode: "light",
  };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `${"•".repeat(Math.max(0, num.length - 4))}${num.slice(-4)}`;
}
