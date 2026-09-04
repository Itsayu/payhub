import { OrgAdminShell } from "@/components/features/admin/org-admin-shell";
import { ThemeEditor } from "@/components/features/admin/theme-editor";
import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";

export default async function ThemeAdminPage({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) notFound();

  return (
    <OrgAdminShell orgName={org.name}>
      <div className="p-6 md:p-8">
        <ThemeEditor orgSlug={org_slug} theme={org.theme} />
      </div>
    </OrgAdminShell>
  );
}
