"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentAccount, AccountStatus, BankAccountType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
} from "@/lib/actions/org-admin-actions";
import { uploadOrgFileAction } from "@/lib/actions/public-actions";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

interface AccountForm {
  accountType: BankAccountType;
  status: AccountStatus;
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  qrImageUrl: string;
  description: string;
  visibleToClients: boolean;
}

const emptyForm: AccountForm = {
  accountType: "savings",
  status: "active",
  bankName: "",
  branch: "",
  accountHolderName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  qrImageUrl: "",
  description: "",
  visibleToClients: true,
};

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  savings: "Savings",
  current: "Current",
  salary: "Salary",
  other: "Other",
};

function maskAccountNumber(num: string) {
  if (!num) return "";
  if (num.length <= 4) return num;
  return `••••${num.slice(-4)}`;
}

export function AccountsManager({ orgSlug, accounts }: { orgSlug: string; accounts: PaymentAccount[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return accounts
      .filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))
      .filter((a) =>
        search
          ? [a.bankName, a.accountHolderName, a.accountNumber, a.upiId, a.branch]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [accounts, search, statusFilter]);

  const isFormMissingRequired =
    !form.bankName.trim() || !form.accountHolderName.trim() || !form.accountNumber.trim();

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setCreating(true);
  }

  function openEdit(a: PaymentAccount) {
    setCreating(false);
    setEditingId(a.id);
    setForm({
      accountType: a.accountType ?? "savings",
      status: a.status,
      bankName: a.bankName,
      branch: a.branch ?? "",
      accountHolderName: a.accountHolderName,
      accountNumber: a.accountNumber,
      ifsc: a.ifsc ?? "",
      upiId: a.upiId ?? "",
      qrImageUrl: a.qrImageUrl ?? "",
      description: a.description ?? "",
      visibleToClients: a.visibleToClients ?? true,
    });
  }

  function closeForm() {
    setCreating(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit() {
    if (isFormMissingRequired) {
      toast.error("Bank name, account holder name and account number are required");
      return;
    }
    setSubmitting(true);
    const payload = { ...form, accountName: form.bankName, priority: 0, tags: [] as string[] };
    const res = editingId
      ? await updateAccountAction(orgSlug, editingId, payload)
      : await createAccountAction(orgSlug, payload);
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error ?? "Failed to save account");
      return;
    }
    toast.success(editingId ? "Bank account updated" : "Bank account added");
    closeForm();
    router.refresh();
  }

  async function onUploadQr(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadOrgFileAction(orgSlug, fd);
    setUploading(false);
    if (!res.success) {
      toast.error(res.error ?? "Upload failed");
      return;
    }
    setForm((f) => ({ ...f, qrImageUrl: res.url }));
    toast.success("QR image uploaded");
  }

  async function onDelete(id: string) {
    const res = await deleteAccountAction(orgSlug, id);
    if (!res.success) toast.error("Failed to delete");
    else toast.success("Bank account deleted");
    setConfirmDeleteId(null);
    if (editingId === id) closeForm();
    router.refresh();
  }

  async function onToggleVisibility(a: PaymentAccount) {
    setTogglingId(a.id);
    const nextVisible = !(a.visibleToClients ?? true);
    const res = await updateAccountAction(orgSlug, a.id, {
      accountName: a.accountName || a.bankName,
      accountType: a.accountType ?? "savings",
      bankName: a.bankName,
      branch: a.branch ?? "",
      accountHolderName: a.accountHolderName,
      accountNumber: a.accountNumber,
      ifsc: a.ifsc ?? "",
      upiId: a.upiId ?? "",
      qrImageUrl: a.qrImageUrl ?? "",
      description: a.description ?? "",
      priority: a.priority ?? 0,
      status: a.status,
      tags: a.tags ?? [],
      visibleToClients: nextVisible,
    });
    setTogglingId(null);
    if (!res.success) {
      toast.error("Failed to update visibility");
      return;
    }
    toast.success(nextVisible ? "Now shown to clients" : "Hidden from clients");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold sm:text-2xl">Payment Accounts</h1>
        <p className="text-sm text-muted-foreground">Manage the bank accounts shown on your public payment page.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </Select>
        <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4" /> Add bank account
        </Button>
      </div>

      {filtered.length === 0 && !creating ? (
        <div className="mb-4 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground sm:p-16">
          {accounts.length === 0
            ? "No payment accounts yet. Click \"Add bank account\" above to add your first one."
            : "No accounts match your filters."}
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {filtered.map((a) => {
            const visible = a.visibleToClients ?? true;
            const isEditingThis = editingId === a.id;
            return (
              <div
                key={a.id}
                className={`rounded-xl border bg-card p-4 transition sm:p-5 ${
                  isEditingThis ? "border-primary/50 ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold sm:text-lg">{a.bankName}</div>
                    <div className="truncate text-sm text-muted-foreground">{a.accountHolderName}</div>
                    <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {[maskAccountNumber(a.accountNumber), a.ifsc, a.upiId].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[a.accountType ?? "savings"]}</Badge>
                      <Badge variant={a.status === "active" ? "success" : a.status === "archived" ? "secondary" : "warning"}>
                        {a.status}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={visible ? "warning" : "secondary"} className="shrink-0">
                    {visible ? "Shown to clients" : "Hidden from clients"}
                  </Badge>
                </div>

                {isEditingThis ? (
                  <AccountFormFields
                    form={form}
                    setForm={setForm}
                    uploading={uploading}
                    onUploadQr={onUploadQr}
                    submitting={submitting}
                    disableSave={isFormMissingRequired}
                    onSubmit={onSubmit}
                    onCancel={closeForm}
                    heading="Edit Bank Account"
                  />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={togglingId === a.id}
                      onClick={() => onToggleVisibility(a)}
                    >
                      {togglingId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {visible ? "Hide from clients" : "Show to clients"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDeleteId(a.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!creating && filtered.length > 0 && (
        <button
          type="button"
          onClick={openCreate}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Add bank account
        </button>
      )}

      {creating && (
        <div className="rounded-xl border border-primary/50 bg-card p-4 ring-1 ring-primary/30 sm:p-6">
          <AccountFormFields
            form={form}
            setForm={setForm}
            uploading={uploading}
            onUploadQr={onUploadQr}
            submitting={submitting}
            disableSave={isFormMissingRequired}
            onSubmit={onSubmit}
            onCancel={closeForm}
            heading="Add Bank Account"
          />
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <h3 className="mb-2 font-semibold">Delete this bank account?</h3>
            <p className="mb-6 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => onDelete(confirmDeleteId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The bank-account edit/create form. Rendered inline — either inside the
 * specific account card being edited, or in the "add new" section — so it
 * always appears right where the user clicked Edit/Add rather than
 * somewhere else on the page.
 */
function AccountFormFields({
  form,
  setForm,
  uploading,
  onUploadQr,
  submitting,
  disableSave,
  onSubmit,
  onCancel,
  heading,
}: {
  form: AccountForm;
  setForm: React.Dispatch<React.SetStateAction<AccountForm>>;
  uploading: boolean;
  onUploadQr: (file: File) => void;
  submitting: boolean;
  disableSave: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  heading: string;
}) {
  return (
    <div className="mt-3 border-t border-border pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{heading}</h2>
        <button onClick={onCancel} className="rounded-sm text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Bank Name" required>
          <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. Canara Bank" />
        </Field>
        <Field label="Account Holder Name" required>
          <Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} placeholder="e.g. Sharma Electronics" />
        </Field>

        <Field label="Account Number" required>
          <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="font-mono" placeholder="998877665544" />
        </Field>
        <Field label="IFSC Code">
          <Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} className="font-mono" placeholder="CNRB0001987" />
        </Field>

        <Field label="Branch">
          <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. MG Road" />
        </Field>
        <Field label="Account Type">
          <Select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value as BankAccountType })}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="salary">Salary</option>
            <option value="other">Other</option>
          </Select>
        </Field>

        <Field label="UPI ID" hint="optional">
          <Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="name@bank" />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AccountStatus })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>

        <Field label="Scanner / QR image" hint="optional" full>
          <div className="flex items-center gap-3">
            {form.qrImageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.qrImageUrl} alt="QR" className="h-20 w-20 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, qrImageUrl: "" }))}
                  className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No QR
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {form.qrImageUrl ? "Replace QR Image" : "Choose File"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadQr(e.target.files[0])}
              />
            </label>
          </div>
        </Field>

        <Field label="Description" hint="optional note shown to customers" full>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Preferred for business payments" />
        </Field>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.visibleToClients}
              onChange={(e) => setForm({ ...form, visibleToClients: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            Visible to clients on the public payment page
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={onSubmit} disabled={submitting || disableSave}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        {disableSave && (
          <span className="text-xs text-muted-foreground">
            Bank name, account holder name and account number are required.
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
        {hint && <span className="font-normal text-muted-foreground"> ({hint})</span>}
      </Label>
      {children}
    </div>
  );
}
