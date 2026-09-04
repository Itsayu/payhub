import { SuperAdminShell } from "@/components/features/superadmin/super-admin-shell";

export default function SuperAdminLogsPage() {
  return (
    <SuperAdminShell>
      <div className="p-6 md:p-8">
        <h1 className="mb-2 text-2xl font-bold">Logs</h1>
        <p className="text-sm text-muted-foreground">This section is available for extension — wire up real data here.</p>
      </div>
    </SuperAdminShell>
  );
}
