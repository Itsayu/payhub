"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentAccount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRandomAccountAction, trackCopyAction, trackQrViewAction } from "@/lib/actions/public-actions";
import { toast } from "sonner";
import {
  Copy,
  Shuffle,
  Building2,
  User,
  Hash,
  Landmark,
  QrCode,
  Check,
} from "lucide-react";

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const key = "payhub_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function PaymentCard({
  orgSlug,
  orgName,
  logoUrl,
  primaryColor,
}: {
  orgSlug: string;
  orgName: string;
  logoUrl: string;
  primaryColor: string;
}) {
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchAccount = useCallback(
    async (excludeId?: string) => {
      setLoading(true);
      setError(null);
      const visitorId = getVisitorId();
      const res = await getRandomAccountAction(orgSlug, excludeId, visitorId);
      setLoading(false);
      if (!res.success) {
        setError(res.error);
        setAccount(null);
        return;
      }
      setAccount(res.account);
    },
    [orgSlug]
  );

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy(value: string, field: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success("Copied Successfully");
    if (account) trackCopyAction(orgSlug, account.id, field, getVisitorId());
    setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500);
  }

  const fields = account
    ? [
        { label: "Bank Name", value: account.bankName, icon: Landmark },
        { label: "Account Holder", value: account.accountHolderName, icon: User },
        { label: "Account Number", value: account.accountNumber, icon: Hash },
        { label: "IFSC", value: account.ifsc, icon: Building2 },
        { label: "UPI ID", value: account.upiId, icon: Hash },
      ].filter((f) => f.value)
    : [];

  return (
    <div className="mx-auto w-full max-w-md">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-32 mx-auto" />
          </motion.div>
        ) : error || !account ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"
          >
            <p className="text-muted-foreground">{error ?? "No active payment accounts available right now."}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchAccount()}>
              Try Again
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          >
            <div className="flex items-center gap-3 p-6 pb-4" style={{ backgroundColor: `${primaryColor}15` }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={orgName} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {orgName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold">{orgName}</div>
                <div className="text-xs text-muted-foreground capitalize">
                 {/* {orgName} · */} {account.accountType ?? "savings"} account
                </div>
              </div>
            </div>

            {account.description && (
              <p className="px-6 pt-4 text-sm text-muted-foreground">{account.description}</p>
            )}

            <div className="space-y-1 p-6">
              {fields.map((f) => (
                <button
                  key={f.label}
                  onClick={() => copy(f.value, f.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-muted"
                >
                  <div className="flex items-center gap-2.5">
                    <f.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">{f.label}</div>
                      <div className="font-mono text-sm font-medium">{f.value}</div>
                    </div>
                  </div>
                  {copiedField === f.label ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>

            {account.qrImageUrl && (
              <div className="flex flex-col items-center gap-2 border-t border-border p-6">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <QrCode className="h-3.5 w-3.5" /> Scan to pay
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={account.qrImageUrl}
                  alt="Payment QR Code"
                  className="h-40 w-40 rounded-lg border border-border object-cover"
                  onLoad={() => trackQrViewAction(orgSlug, account.id, getVisitorId())}
                />
              </div>
            )}

            <div className="border-t border-border p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchAccount(account.id)}
              >
                <Shuffle className="h-4 w-4" /> Show Another Account
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
