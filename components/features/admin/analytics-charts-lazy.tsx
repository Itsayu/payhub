"use client";

import dynamic from "next/dynamic";

// recharts is a sizeable dependency (~100kb+) that only the analytics page
// needs — loading it lazily (client-side only, with a lightweight skeleton)
// keeps it off every other admin page's bundle and speeds up first load.
// `ssr: false` requires this to live in a Client Component (hence this
// small wrapper file, imported by the server-rendered analytics page).
export const AnalyticsCharts = dynamic(
  () => import("./analytics-charts").then((m) => m.AnalyticsCharts),
  {
    ssr: false,
    loading: () => <AnalyticsSkeleton />,
  }
);

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[72px] rounded-xl border border-border bg-muted/50" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-border bg-muted/50" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-muted/50" />
        <div className="h-64 rounded-xl border border-border bg-muted/50" />
      </div>
    </div>
  );
}
