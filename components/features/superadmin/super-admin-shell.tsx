"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { superAdminLogoutAction } from "@/lib/actions/super-admin-actions";
import {
  Building2,
  BarChart3,
  Users,
  Settings,
  ScrollText,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/super-admin", label: "Organizations", icon: Building2 },
  { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/super-admin/users", label: "Users", icon: Users },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/super-admin/logs", label: "Logs", icon: ScrollText },
  { href: "/super-admin/profile", label: "Profile", icon: UserCircle },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await superAdminLogoutAction();
    router.push("/super-admin/login");
    router.refresh();
  }

  const currentLabel = links.find((l) => l.href === pathname)?.label ?? "Super Admin";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top header — always visible, sign out top-right */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-bold">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">P</div>
            <span className="hidden sm:inline">Super Admin</span>
          </div>
          <span className="hidden text-sm text-muted-foreground md:inline">/ {currentLabel}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
        </button>
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
                <span className="font-bold">Super Admin</span>
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
              </nav>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
