"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeSettings } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateThemeAction } from "@/lib/actions/org-admin-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ThemeEditor({ orgSlug, theme }: { orgSlug: string; theme: ThemeSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<ThemeSettings>(theme);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    const res = await updateThemeAction(orgSlug, form);
    setSaving(false);
    if (!res.success) return toast.error(res.error ?? "Failed to save");
    toast.success("Theme updated");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Theme Customization</h1>
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Theme
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Colors & Layout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <Input type="color" className="h-10 p-1" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Color</Label>
                <Input type="color" className="h-10 p-1" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Background</Label>
                <Input type="color" className="h-10 p-1" value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Card Radius (px)</Label>
                <Input type="number" min={0} max={32} value={form.cardRadius} onChange={(e) => setForm({ ...form, cardRadius: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Font</Label>
              <Select value={form.font} onChange={(e) => setForm({ ...form, font: e.target.value })}>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Lato">Lato</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Mode</Label>
              <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as any })}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
          <CardContent>
            <div
              className="rounded-lg border p-6"
              style={{
                backgroundColor: form.background,
                borderRadius: `${form.cardRadius}px`,
                fontFamily: form.font,
              }}
            >
              <div className="mb-3 h-8 w-24 rounded" style={{ backgroundColor: form.primaryColor }} />
              <div className="mb-2 h-4 w-2/3 rounded bg-black/10" />
              <div className="mb-4 h-4 w-1/2 rounded bg-black/10" />
              <button
                className="rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: form.secondaryColor, borderRadius: `${form.cardRadius / 2}px` }}
              >
                Sample Button
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
