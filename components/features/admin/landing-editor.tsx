"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPageContent } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLandingAction } from "@/lib/actions/org-admin-actions";
import { uploadOrgFileAction } from "@/lib/actions/public-actions";
import { toast } from "sonner";
import { Loader2, Upload, ExternalLink } from "lucide-react";

const fields: { key: keyof LandingPageContent; label: string; type?: "text" | "textarea" | "color" }[] = [
  { key: "heading", label: "Heading" },
  { key: "subHeading", label: "Sub Heading" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "primaryColor", label: "Primary Color", type: "color" },
  { key: "secondaryColor", label: "Secondary Color", type: "color" },
  { key: "buttonText", label: "Call To Action Button Text" },
  { key: "footerText", label: "Footer Text" },
  { key: "supportPhone", label: "Support Number" },
  { key: "supportEmail", label: "Support Email" },
  { key: "address", label: "Address" },
  { key: "website", label: "Website" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "seoTitle", label: "SEO Title" },
  { key: "seoDescription", label: "SEO Description", type: "textarea" },
];

export function LandingEditor({ orgSlug, landing }: { orgSlug: string; landing: LandingPageContent }) {
  const router = useRouter();
  const [form, setForm] = useState<LandingPageContent>(landing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "banner" | "favicon" | null>(null);

  function set<K extends keyof LandingPageContent>(key: K, value: LandingPageContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function upload(kind: "logo" | "banner" | "favicon", file: File) {
    setUploading(kind);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadOrgFileAction(orgSlug, fd);
    setUploading(null);
    if (!res.success) return toast.error("Upload failed");
    if (kind === "logo") set("logoUrl", res.url);
    if (kind === "banner") set("bannerUrl", res.url);
    if (kind === "favicon") set("faviconUrl", res.url);
    toast.success("Image uploaded");
  }

  async function onSave() {
    setSaving(true);
    const res = await updateLandingAction(orgSlug, form);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Failed to save");
    toast.success("Landing page updated");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Landing Page Builder</h1>
        <div className="flex gap-2">
          <a href={`/${orgSlug}`} target="_blank" rel="noreferrer">
            <Button variant="outline"><ExternalLink className="h-4 w-4" /> Preview</Button>
          </a>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <UploadRow label="Logo" url={form.logoUrl} uploading={uploading === "logo"} onUpload={(f) => upload("logo", f)} />
            <UploadRow label="Banner" url={form.bannerUrl} uploading={uploading === "banner"} onUpload={(f) => upload("banner", f)} />
            <UploadRow label="Favicon" url={form.faviconUrl} uploading={uploading === "favicon"} onUpload={(f) => upload("favicon", f)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Content & Contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.key] as string} onChange={(e) => set(f.key, e.target.value as any)} />
                ) : (
                  <Input
                    type={f.type === "color" ? "color" : "text"}
                    value={form[f.key] as string}
                    onChange={(e) => set(f.key, e.target.value as any)}
                    className={f.type === "color" ? "h-10 p-1" : undefined}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UploadRow({
  label,
  url,
  uploading,
  onUpload,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-14 w-14 rounded-md border border-border object-cover" />
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
          None
        </div>
      )}
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}
