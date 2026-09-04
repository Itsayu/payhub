"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orgAdminUniversalLoginAction } from "@/lib/actions/org-admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEMO_PASSWORD = "Temp@123";
const DEMO_ACCOUNTS = [
  { label: "Acme Traders", username: "acmaacme" },
  { label: "Bright School", username: "briabrig" },
  { label: "Modern Mart", username: "modamode" },
];

export default function UniversalAdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function doLogin(loginUsername: string, loginPassword: string) {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("username", loginUsername);
    fd.set("password", loginPassword);
    const result = await orgAdminUniversalLoginAction(fd);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
      return;
    }
    toast.success("Welcome back!");
    if (result.forcePasswordChange) {
      router.push(`/${result.orgSlug}/admin/change-password`);
    } else {
      router.push(`/${result.orgSlug}/admin`);
    }
    router.refresh();
  }

  async function onSubmit(formData: FormData) {
    await doLogin(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  }

  function useDemo(demoUsername: string) {
    setUsername(demoUsername);
    setPassword(DEMO_PASSWORD);
    setError(null);
    void doLogin(demoUsername, DEMO_PASSWORD);
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center px-4 sm:px-6">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle>Organization Admin Login</CardTitle>
          <CardDescription>Sign in with your username to reach your organization's dashboard</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="e.g. a3kaacme"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
            </Button>
          </form>

          <div className="mt-5 rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
              Try it instantly with a demo organization
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.username}
                  type="button"
                  disabled={loading}
                  onClick={() => useDemo(demo.username)}
                  className="rounded-md border border-border bg-card px-2 py-2 text-center text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
                >
                  {demo.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Signs you straight in · password for every demo account is{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            You'll be redirected straight to your organization's dashboard. Forgot your password? Contact your
            Super Admin to reset it.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
