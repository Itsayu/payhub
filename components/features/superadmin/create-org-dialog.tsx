"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizationSchema, CreateOrganizationInput } from "@/lib/schemas";
import { createOrganizationAction } from "@/lib/actions/super-admin-actions";
import type { CreatedOrgCredentials } from "@/lib/services/org-service";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Printer, Download, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateOrgDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<CreatedOrgCredentials | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { status: "active", themeColor: "", logoUrl: "", email: "", orgId: "" },
  });

  async function onSubmit(data: CreateOrganizationInput) {
    setSubmitting(true);
    const result = await createOrganizationAction(data);
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to create organization");
      return;
    }
    setCredentials(result.credentials!);
    reset();
    router.refresh();
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  function closeAll() {
    setOpen(false);
    setCredentials(null);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Create Organization
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeAll())}>
        {!credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input {...register("name")} placeholder="Acme Traders" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Unique Slug</Label>
                <Input {...register("slug")} placeholder="acme" />
                <p className="text-xs text-muted-foreground">Used in the public URL: my-domain.com/acme</p>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input {...register("phone")} placeholder="+1 555 000 0000" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input {...register("email")} placeholder="contact@acme.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Org ID <span className="font-normal text-muted-foreground">(optional — letters, numbers, up to 6 characters)</span>
                </Label>
                <Input {...register("orgId")} placeholder="Leave blank to auto-generate" maxLength={6} className="font-mono uppercase" />
                <p className="text-xs text-muted-foreground">Any mix of letters and numbers works, e.g. A3K9F2 or 100200.</p>
                {errors.orgId && <p className="text-xs text-destructive">{errors.orgId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select {...register("status")}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Theme, colors and logo are entirely up to the organization — the admin can set those later from their own Theme page.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAll}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Organization
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Organization Created Successfully</DialogTitle>
            </DialogHeader>
            <div id="creds-printable" className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <Row label="Login URL" value={credentials.loginUrl} onCopy={copy} />
              <Row label="Username" value={credentials.username} onCopy={copy} />
              <Row label="Temporary Password" value={credentials.temporaryPassword} onCopy={copy} />
              <Row label="Organization ID" value={credentials.organizationId} onCopy={copy} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Share these credentials with the organization manually. They'll be required to set a new password on first login.
            </p>
            <DialogFooter className="flex-wrap justify-between gap-3 sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `Organization Credentials\n\nLogin URL: ${credentials.loginUrl}\nUsername: ${credentials.username}\nTemporary Password: ${credentials.temporaryPassword}\nOrganization ID: ${credentials.organizationId}\n`,
                      ],
                      { type: "text/plain" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${credentials.slug}-credentials.txt`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
              <Button onClick={closeAll}>Done</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  );
}

function Row({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-mono font-medium">{value}</div>
      </div>
      <Button size="icon" variant="ghost" className="shrink-0" onClick={() => onCopy(value, label)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
