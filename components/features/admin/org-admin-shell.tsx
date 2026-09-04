"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { orgAdminLogoutAction } from "@/lib/actions/org-admin-actions";
import {
  LayoutDashboard,
  Wallet,
  Globe,
  BarChart3,
  Palette,
  Settings,
  UserCircle,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

export function OrgAdminShell({
  children,
  orgName,
}: {
  children: React.ReactNode;
  orgName?: string;
}) {
  const pathname = usePathname();
  const params = useParams<{ org_slug: string }>();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const base = `/${params.org_slug}/admin`;

  const links = [
    { href: base, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/accounts`, label: "Payment Accounts", icon: Wallet },
    { href: `${base}/landing`, label: "Landing Page", icon: Globe },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `${base}/theme`, label: "Theme", icon: Palette },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
    { href: `${base}/profile`, label: "Profile", icon: UserCircle },
  ];

  async function handleLogout() {
    await orgAdminLogoutAction();
    router.push(`/${params.org_slug}/admin/login`);
    router.refresh();
  }

  const currentLabel = links.find((l) => l.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top header — always visible, sign out top-right */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-muted md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate font-bold">{orgName ?? params.org_slug}</div>
            <div className="hidden text-xs text-muted-foreground sm:block">{currentLabel}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`/${params.org_slug}/user`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
          >
            <ExternalLink className="h-4 w-4" /> Public Page
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
          <nav className="flex-1 space-y-1 p-3">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
                    active && "bg-primary/10 text-primary"
                  )}
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
            <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
              <div className="flex items-center justify-between px-4 py-4">
                <span className="truncate font-bold">{orgName ?? params.org_slug}</span>
                <button onClick={() => setDrawerOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-3">
                {links.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted",
                        active && "bg-primary/10 text-primary"
                      )}
                    >
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  );
                })}
                <a
                  href={`/${params.org_slug}/user`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" /> View Public Page
                </a>
              </nav>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
