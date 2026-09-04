import { SuperAdminShell } from "@/components/features/superadmin/super-admin-shell";
import { getStorage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getStorage().getOrganizationById(id);
  if (!org) notFound();

  return (
    <SuperAdminShell>
      <div className="p-6 md:p-8">
        <Link href="/super-admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: org.themeColor }}
            >
              {org.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {org.id} · <Badge variant={org.status === "active" ? "success" : "destructive"}>{org.status}</Badge>
              </div>
            </div>
          </div>
          <a href={`/${org.slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline"><ExternalLink className="h-4 w-4" /> View Public Page</Button>
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Organization Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail label="Slug" value={org.slug} />
              <Detail label="Phone" value={org.phone} />
              <Detail label="Email" value={org.email} />
              <Detail label="Created" value={formatDate(org.createdAt)} />
              <Detail label="Updated" value={formatDate(org.updatedAt)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Admin Account</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail label="Username" value={org.admin.username} />
              <Detail
                label="Force Password Change"
                value={org.admin.forcePasswordChange ? "Yes" : "No"}
              />
              <Detail label="Created" value={formatDate(org.admin.createdAt)} />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Payment Accounts ({org.accounts.length})</CardTitle></CardHeader>
            <CardContent>
              {org.accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment accounts added yet.</p>
              ) : (
                <div className="space-y-2">
                  {org.accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <div>
                        <div className="font-medium">{a.accountName}</div>
                        <div className="text-xs text-muted-foreground">{a.bankName} · {a.accountHolderName}</div>
                      </div>
                      <Badge variant={a.status === "active" ? "success" : "secondary"}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
