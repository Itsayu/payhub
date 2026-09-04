import { OrgAdminShell } from "@/components/features/admin/org-admin-shell";
import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/features/admin/copy-link-button";

export default async function SettingsPage({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) notFound();

  return (
    <OrgAdminShell orgName={org.name}>
      <div className="p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader><CardTitle>Organization Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Organization ID" value={org.id} />
            <Row label="Name" value={org.name} />
            <Row label="Slug" value={org.slug} />
            <Row label="Phone" value={org.phone} />
            <Row label="Email" value={org.email} />
            <Row label="Status" value={org.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Generate Public Link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <LinkRow label="Organization Page" path={`/${org.slug}`} />
            <LinkRow label="Client Payment Page" path={`/${org.slug}/user`} />
          </CardContent>
        </Card>
      </div>
    </OrgAdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LinkRow({ label, path }: { label: string; path: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{path}</div>
      </div>
      <CopyLinkButton path={path} />
    </div>
  );
}
