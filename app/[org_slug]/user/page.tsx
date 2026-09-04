import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";
import { PaymentCard } from "@/components/features/public/payment-card";
import Link from "next/link";

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ org_slug: string }>;
}) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org || org.status !== "active") notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      {/* <Link href={`/${org_slug}`} className="mb-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back to {org.name}
      </Link> */}
      <h1 className="mb-1 text-center text-2xl font-bold">Payment Details</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Tap any field to copy it instantly
      </p>
      <PaymentCard
        orgSlug={org_slug}
        orgName={org.name}
        logoUrl={org.landing.logoUrl || org.logoUrl}
        primaryColor={org.theme.primaryColor || org.themeColor}
      />
    </main>
  );
}
