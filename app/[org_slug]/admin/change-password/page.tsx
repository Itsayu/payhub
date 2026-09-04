"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { changeOrgAdminPasswordAction } from "@/lib/actions/org-admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const params = useParams<{ org_slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await changeOrgAdminPasswordAction(params.org_slug, formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to change password");
      return;
    }
    toast.success("Password changed successfully");
    router.push(`/${params.org_slug}/admin`);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Set a New Password</CardTitle>
          <CardDescription>You must change your temporary password before continuing</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" placeholder="At least 8 characters" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
