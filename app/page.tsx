import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  Zap,
  Building2,
  QrCode,
  BarChart3,
  Palette,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  { icon: Building2, title: "Multi-Tenant Ready", desc: "Every organization gets its own branded public page, admin dashboard, and isolated data." },
  { icon: QrCode, title: "Unlimited Payment Accounts", desc: "Add bank accounts and UPI IDs with QR codes. Show one randomly on every visit." },
  { icon: ShieldCheck, title: "Secure by Design", desc: "Role-based access control, hashed passwords, and forced password resets on first login." },
  { icon: Palette, title: "Fully Customizable", desc: "Edit your landing page, theme colors, logo, and branding — all live, no code required." },
  { icon: BarChart3, title: "Built-in Analytics", desc: "Track visits, copies, QR scans, and most-used accounts with clear charts." },
  { icon: Zap, title: "Instant Sharing", desc: "Generate a public payment link customers can open with zero login required." },
];

const pricing = [
  { name: "Starter", price: "Free", desc: "For a single organization getting started", features: ["1 Organization", "Up to 3 payment accounts", "Basic analytics", "Community support"] },
  { name: "Growth", price: "$29/mo", desc: "For growing businesses managing more accounts", features: ["Unlimited payment accounts", "Full analytics suite", "Theme customization", "Priority support"], highlighted: true },
  { name: "Enterprise", price: "Contact us", desc: "For platforms managing many organizations", features: ["Unlimited organizations", "Super Admin controls", "Dedicated onboarding", "SLA & custom integrations"] },
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">P</div>
            payhub
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/super-admin/login"><Button variant="outline" size="sm">Super Admin</Button></Link>
            <Link href="/admin"><Button size="sm">Org Login</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Zap className="h-3.5 w-3.5" /> Multi-tenant payment management, simplified
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Share payment details, <span className="text-primary">securely</span> and beautifully
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          payhub gives every organization a branded public page, unlimited payment accounts,
          and instant analytics — without exposing sensitive data to the wrong people.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/super-admin/login">
            <Button size="lg">Get Started <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link href="/acme/user">
            <Button size="lg" variant="outline">View Demo Payment Page</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-2 text-center text-3xl font-bold">Everything you need</h2>
        <p className="mb-12 text-center text-muted-foreground">A complete toolkit for managing organizational payments at scale.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-bold">Simple pricing</h2>
          <p className="mb-12 text-center text-muted-foreground">Choose the plan that fits your organization.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {pricing.map((p) => (
              <Card key={p.name} className={p.highlighted ? "border-primary shadow-lg" : ""}>
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <div className="text-3xl font-bold">{p.price}</div>
                  <CardDescription>{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={p.highlighted ? "default" : "outline"}>
                    Choose {p.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About + Contact */}
      <section id="about" className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">About payhub</h2>
        <p className="text-muted-foreground">
          payhub SaaS was built to help organizations of every size — schools, shops, traders —
          share verified payment information with customers without the risk of manual, unsecured sharing.
        </p>
      </section>

      <section id="contact" className="border-t border-border py-12 text-center">
        <h3 className="text-xl font-semibold">Have questions?</h3>
        <p className="mt-2 text-muted-foreground">Reach us at support@payhub.com</p>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} payhub SaaS. All rights reserved.
      </footer>
    </main>
  );
}
