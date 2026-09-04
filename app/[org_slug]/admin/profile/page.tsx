import { OrgAdminShell } from "@/components/features/admin/org-admin-shell";
import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) notFound();

  return (
    <OrgAdminShell orgName={org.name}>
      <div className="p-6 md:p-8">
        <h1 className="mb-6 text-2xl font-bold">Profile</h1>
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Admin Account</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Username" value={org.admin.username} />
            <Row label="Organization" value={org.name} />
            <Row label="Account Created" value={formatDate(org.admin.createdAt)} />
            <Row label="Last Updated" value={formatDate(org.admin.updatedAt)} />
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
