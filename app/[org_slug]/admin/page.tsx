import { OrgAdminShell } from "@/components/features/admin/org-admin-shell";
import { getOrganization } from "@/lib/services/org-service";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarClock,
  Copy,
  QrCode,
} from "lucide-react";

export default async function OrgAdminDashboard({
  params,
}: {
  params: Promise<{ org_slug: string }>;
}) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) notFound();

  const today = new Date().toDateString();
  const totalAccounts = org.accounts.length;
  const activeAccounts = org.accounts.filter((a) => a.status === "active").length;
  const inactiveAccounts = totalAccounts - activeAccounts;
  const publicVisits = org.analytics.filter((e) => e.type === "public_visit").length;
  const todaysVisits = org.analytics.filter(
    (e) => e.type === "public_visit" && new Date(e.createdAt).toDateString() === today
  ).length;
  const copyActions = org.analytics.filter((e) => e.type === "field_copied").length;
  const qrScans = org.analytics.filter((e) => e.type === "qr_view").length;

  const stats = [
    { label: "Total Accounts", value: totalAccounts, icon: Wallet },
    { label: "Active Accounts", value: activeAccounts, icon: CheckCircle2 },
    { label: "Inactive Accounts", value: inactiveAccounts, icon: XCircle },
    { label: "Public Visits", value: publicVisits, icon: Eye },
    { label: "Today's Visits", value: todaysVisits, icon: CalendarClock },
    { label: "Copy Actions", value: copyActions, icon: Copy },
    { label: "QR Scans", value: qrScans, icon: QrCode },
  ];

  return (
    <OrgAdminShell orgName={org.name}>
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold">Welcome back, {org.name}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Here's what's happening with your payment accounts.
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

        <Card className="mt-8">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <div className="font-medium">Your public payment page</div>
              <div className="text-sm text-muted-foreground">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${org.slug}/user`}
              </div>
            </div>
            <a
              href={`/${org.slug}/user`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open page →
            </a>
          </CardContent>
        </Card>
      </div>
    </OrgAdminShell>
  );
}
