"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#6D28D9", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function AnalyticsCharts({
  dailyVisits,
  mostDisplayed,
  fieldData,
  summary,
}: {
  dailyVisits: { date: string; visits: number }[];
  mostDisplayed: { name: string; count: number }[];
  fieldData: { name: string; value: number }[];
  summary: { uniqueVisitors: number; qrViews: number; totalVisits: number };
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatBox label="Total Visits" value={summary.totalVisits} />
        <StatBox label="Unique Visitors" value={summary.uniqueVisitors} />
        <StatBox label="QR Views" value={summary.qrViews} />
      </div>

      <Card>
        <CardHeader><CardTitle>Daily Visits (Last 14 Days)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {dailyVisits.every((d) => d.visits === 0) ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVisits}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="#6D28D9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Most Displayed Accounts</CardTitle></CardHeader>
          <CardContent className="h-64">
            {mostDisplayed.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostDisplayed}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most Copied Field</CardTitle></CardHeader>
          <CardContent className="h-64">
            {fieldData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fieldData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {fieldData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data yet — analytics will appear once your public page gets visits.
    </div>
  );
}
