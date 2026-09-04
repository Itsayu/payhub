import { getOrganization } from "@/lib/services/org-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org_slug: string }>;
}): Promise<Metadata> {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org) return {};
  return {
    title: org.landing.seoTitle || org.name,
    description: org.landing.seoDescription || org.landing.description,
    icons: org.landing.faviconUrl ? [{ url: org.landing.faviconUrl }] : undefined,
  };
}

export default async function OrgPublicPage({
  params,
}: {
  params: Promise<{ org_slug: string }>;
}) {
  const { org_slug } = await params;
  const org = await getOrganization(org_slug);
  if (!org || org.status !== "active") notFound();

  const { landing } = org;
  const social = [
    { href: landing.facebook, icon: Facebook },
    { href: landing.instagram, icon: Instagram },
    { href: landing.linkedin, icon: Linkedin },
    { href: landing.whatsapp, icon: MessageCircle },
  ].filter((s) => s.href);

  return (
    <main style={{ backgroundColor: "#fff" }}>
      {/* Banner */}
      <div
        className="relative flex h-64 items-end justify-center bg-cover bg-center sm:h-80"
        style={{
          backgroundColor: landing.primaryColor,
          backgroundImage: landing.bannerUrl ? `url(${landing.bannerUrl})` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col items-center pb-8 text-center text-white">
          {landing.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={landing.logoUrl} alt={org.name} className="mb-3 h-16 w-16 rounded-xl border-2 border-white object-cover shadow-lg" />
          )}
          <h1 className="text-3xl font-bold sm:text-5xl">{landing.heading}</h1>
          {landing.subHeading && <p className="mt-2 text-lg opacity-90">{landing.subHeading}</p>}
        </div>
      </div>

      {/* Description + CTA */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-lg text-muted-foreground">{landing.description}</p>
        <Link
          href={`/${org_slug}/user`}
          className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
          style={{ backgroundColor: landing.secondaryColor }}
        >
          {landing.buttonText} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Contact */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 sm:grid-cols-3 sm:text-center">
          {landing.supportPhone && <InfoItem icon={Phone} label="Call us" value={landing.supportPhone} />}
          {landing.supportEmail && <InfoItem icon={Mail} label="Email us" value={landing.supportEmail} />}
          {landing.address && <InfoItem icon={MapPin} label="Visit us" value={landing.address} />}
          {landing.website && <InfoItem icon={Globe} label="Website" value={landing.website} />}
        </div>
        {social.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {social.map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        {landing.footerText}
      </footer>
    </main>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
