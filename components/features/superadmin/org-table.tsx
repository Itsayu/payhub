"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Organization } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  suspendOrganizationAction,
  activateOrganizationAction,
  deleteOrganizationAction,
  resetOrgPasswordAction,
  updateOrganizationAction,
} from "@/lib/actions/super-admin-actions";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, Ban, PlayCircle, KeyRound, Trash2, Copy, ShieldCheck, Loader2, Pencil } from "lucide-react";

interface ResetResult {
  orgId: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
}

interface EditForm {
  name: string;
  phone: string;
  email: string;
  status: "active" | "suspended";
}

export function OrgTable({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "", email: "", status: "active" });
  const [savingEdit, setSavingEdit] = useState(false);

  async function handle(action: () => Promise<any>, slug: string) {
    setPending(slug);
    const res = await action();
    setPending(null);
    if (res?.success === false) {
      toast.error(res.error ?? "Action failed");
      return;
    }
    router.refresh();
    return res;
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  function openEdit(org: Organization) {
    setEditingSlug(org.slug);
    setEditForm({ name: org.name, phone: org.phone, email: org.email ?? "", status: org.status });
  }

  async function saveEdit() {
    if (!editingSlug) return;
    setSavingEdit(true);
    const res = await updateOrganizationAction(editingSlug, editForm);
    setSavingEdit(false);
    if (!res.success) {
      toast.error(res.error ?? "Failed to update organization");
      return;
    }
    toast.success("Organization updated");
    setEditingSlug(null);
    router.refresh();
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
        No organizations yet. Click "Create Organization" to add your first one.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: card list */}
      <div className="space-y-3 sm:hidden">
        {organizations.map((org) => (
          <div key={org.id} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: org.themeColor }}
                >
                  {org.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{org.name}</div>
                  <div className="text-xs text-muted-foreground">{org.id} · {org.slug}</div>
                </div>
              </div>
              <Badge variant={org.status === "active" ? "success" : "destructive"}>{org.status}</Badge>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              {org.accounts.length} account{org.accounts.length === 1 ? "" : "s"} · Created {formatDate(org.createdAt)}
            </div>
            <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2">
              <Link href={`/super-admin/orgs/${org.id}`}>
                <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
              </Link>
              <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(org)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Copy public link"
                onClick={() => copy(`${window.location.origin}/${org.slug}`, "Public link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {org.status === "active" ? (
                <Button size="icon" variant="ghost" title="Suspend" disabled={pending === org.slug} onClick={() => handle(() => suspendOrganizationAction(org.slug), org.slug)}>
                  <Ban className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" title="Activate" disabled={pending === org.slug} onClick={() => handle(() => activateOrganizationAction(org.slug), org.slug)}>
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                title="Reset password"
                disabled={pending === org.slug}
                onClick={async () => {
                  const res = await handle(() => resetOrgPasswordAction(org.slug), org.slug);
                  if (res?.success) {
                    setResetResult({ orgId: res.orgId, username: res.username, loginUrl: res.loginUrl, tempPassword: res.tempPassword });
                  }
                }}
              >
                {pending === org.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" title="Delete" onClick={() => setConfirmDelete(org.slug)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Accounts</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-t border-border">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: org.themeColor }}
                  >
                    {org.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground">{org.id}</div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{org.slug}</td>
                <td className="px-4 py-3">
                  <Badge variant={org.status === "active" ? "success" : "destructive"}>
                    {org.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{org.accounts.length}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/super-admin/orgs/${org.id}`}>
                      <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(org)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Copy public link"
                      onClick={() => copy(`${window.location.origin}/${org.slug}`, "Public link")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {org.status === "active" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Suspend"
                        disabled={pending === org.slug}
                        onClick={() => handle(() => suspendOrganizationAction(org.slug), org.slug)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Activate"
                        disabled={pending === org.slug}
                        onClick={() => handle(() => activateOrganizationAction(org.slug), org.slug)}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Reset password"
                      disabled={pending === org.slug}
                      onClick={async () => {
                        const res = await handle(() => resetOrgPasswordAction(org.slug), org.slug);
                        if (res?.success) {
                          setResetResult({
                            orgId: res.orgId,
                            username: res.username,
                            loginUrl: res.loginUrl,
                            tempPassword: res.tempPassword,
                          });
                        }
                      }}
                    >
                      {pending === org.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      onClick={() => setConfirmDelete(org.slug)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <h3 className="mb-2 font-semibold">Delete organization?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              This will permanently delete "{confirmDelete}" and all its data. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await handle(() => deleteOrganizationAction(confirmDelete), confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!resetResult} onOpenChange={(v) => !v && setResetResult(null)}>
        {resetResult && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Temporary Password Generated Successfully</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <Row label="Login URL" value={resetResult.loginUrl} onCopy={copy} />
              <Row label="Username" value={resetResult.username} onCopy={copy} />
              <Row label="New Temporary Password" value={resetResult.tempPassword} onCopy={copy} />
              <Row label="Organization ID" value={resetResult.orgId} onCopy={copy} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The organization admin must change this password on their next login.
            </p>
            <DialogFooter>
              <Button onClick={() => setResetResult(null)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      <Dialog open={!!editingSlug} onOpenChange={(v) => !v && setEditingSlug(null)}>
        {editingSlug && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Organization Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "suspended" })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Slug and Org ID can't be changed after creation since they're used in login links and credentials.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSlug(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate font-mono font-medium">{value}</div>
      </div>
      <Button size="icon" variant="ghost" className="shrink-0" onClick={() => onCopy(value, label)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
