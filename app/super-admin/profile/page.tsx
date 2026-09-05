"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeSuperAdminPasswordAction } from "@/lib/actions/super-admin-actions";
import { SuperAdminShell } from "@/components/features/superadmin/super-admin-shell";
import { KeyRound, X } from "lucide-react";

export default function SuperAdminProfilePage() {
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    const formData = new FormData(event.currentTarget);
    const res = await changeSuperAdminPasswordAction(formData);

    setPasswordLoading(false);

    if (res.success) {
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      (event.target as HTMLFormElement).reset();
      setTimeout(() => {
        setOpenPasswordModal(false);
        setPasswordMessage(null);
      }, 1500);
    } else {
      setPasswordMessage({ type: "error", text: res.error });
    }
  }

  return (
    <SuperAdminShell>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your super admin credentials and security settings.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setOpenPasswordModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-sm shrink-0 px-5 py-2.5"
          >
            <KeyRound className="w-4 h-4" /> Change Password
          </Button>
        </div>
      </div>

      {/* Change Password Modal Overlay */}
      {openPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" /> Change Password
              </h3>
              <button
                type="button"
                onClick={() => setOpenPasswordModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMessage && (
                <div
                  className={`p-3 text-sm rounded-md border ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {passwordLoading ? "Updating..." : "Save Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}