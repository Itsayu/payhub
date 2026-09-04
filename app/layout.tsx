import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/features/public/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "payhub SaaS — Multi-Tenant Payment Management",
  description:
    "Securely manage and share payment accounts for your organization with payhub SaaS.",
};

// Explicit viewport config: correct mobile scaling, no zoom-disabling, and
// viewport-fit=cover so layouts sit properly behind iOS notches/home bars.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#6D28D9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
