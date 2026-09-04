import { SuperAdminShell } from "@/components/features/superadmin/super-admin-shell";
import { CreateOrgDialog } from "@/components/features/superadmin/create-org-dialog";
import { OrgTable } from "@/components/features/superadmin/org-table";
import { Card, CardContent } from "@/components/ui/card";
import { listOrganizations } from "@/lib/services/org-service";
import { Building2, CheckCircle2, Ban, Wallet } from "lucide-react";

export default async function SuperAdminDashboard() {
  const organizations = await listOrganizations();
  const active = organizations.filter((o) => o.status === "active").length;
  const suspended = organizations.filter((o) => o.status === "suspended").length;
  const totalAccounts = organizations.reduce((sum, o) => sum + o.accounts.length, 0);

  const stats = [
    { label: "Total Organizations", value: organizations.length, icon: Building2 },
    { label: "Active", value: active, icon: CheckCircle2 },
    { label: "Suspended", value: suspended, icon: Ban },
    { label: "Total Payment Accounts", value: totalAccounts, icon: Wallet },
  ];

  return (
    <SuperAdminShell>
      <div className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Organizations</h1>
            <p className="text-sm text-muted-foreground">Manage every organization on the platform</p>
          </div>
          <CreateOrgDialog />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <OrgTable organizations={organizations} />
      </div>
    </SuperAdminShell>
  );
}
