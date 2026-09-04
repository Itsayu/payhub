"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { orgAdminLoginAction } from "@/lib/actions/org-admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OrgAdminLoginPage() {
  const params = useParams<{ org_slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await orgAdminLoginAction(params.org_slug, formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
      return;
    }
    toast.success("Welcome back!");
    if (result.forcePasswordChange) {
      router.push(`/${params.org_slug}/admin/change-password`);
    } else {
      router.push(`/${params.org_slug}/admin`);
    }
    router.refresh();
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center px-4 sm:px-6">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle>Organization Admin Login</CardTitle>
          <CardDescription>Sign in to manage {params.org_slug}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder={`${params.org_slug}_admin`} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Forgot your password? Contact your Super Admin to reset it.
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Prefer not to type your org slug? Sign in at{" "}
            <a href="/admin" className="font-medium text-primary hover:underline">
              /admin
            </a>{" "}
            with just your username.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
