import { OrgAdminShell } from "@/components/features/admin/org-admin-shell";
import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";
import { AnalyticsCharts } from "@/components/features/admin/analytics-charts-lazy";

export default async function AnalyticsPage({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) notFound();

  // Daily visits for the last 14 days
  const days: { date: string; visits: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = org.analytics.filter(
      (e) => e.type === "public_visit" && new Date(e.createdAt).toDateString() === d.toDateString()
    ).length;
    days.push({ date: key, visits: count });
  }

  const accountCounts: Record<string, number> = {};
  org.analytics
    .filter((e) => e.type === "account_shown" && e.accountId)
    .forEach((e) => {
      accountCounts[e.accountId!] = (accountCounts[e.accountId!] ?? 0) + 1;
    });
  const mostDisplayed = Object.entries(accountCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({
      name: org.accounts.find((a) => a.id === id)?.accountName ?? "Unknown",
      count,
    }));

  const fieldCounts: Record<string, number> = {};
  org.analytics
    .filter((e) => e.type === "field_copied" && e.field)
    .forEach((e) => {
      fieldCounts[e.field!] = (fieldCounts[e.field!] ?? 0) + 1;
    });
  const fieldData = Object.entries(fieldCounts).map(([field, count]) => ({ name: field, value: count }));

  const uniqueVisitors = new Set(org.analytics.map((e) => e.visitorId)).size;
  const qrViews = org.analytics.filter((e) => e.type === "qr_view").length;

  return (
    <OrgAdminShell orgName={org.name}>
      <div className="p-6 md:p-8">
        <h1 className="mb-6 text-2xl font-bold">Analytics</h1>
        <AnalyticsCharts
          dailyVisits={days}
          mostDisplayed={mostDisplayed}
          fieldData={fieldData}
          summary={{
            uniqueVisitors,
            qrViews,
            totalVisits: org.analytics.filter((e) => e.type === "public_visit").length,
          }}
        />
      </div>
    </OrgAdminShell>
  );
}
