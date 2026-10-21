"use client";

import { useState } from "react";
import { useDHOIP } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  Stethoscope,
  Receipt,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

type RoleInfo = {
  id: Role;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  initials: string;
};

const roles: RoleInfo[] = [
  {
    id: "director",
    name: "Dir. Jonathan C. Ogidi",
    title: "Medical Director",
    description: "Executive visibility across the hospital — KPIs, finance, alerts, and oversight.",
    icon: <ShieldCheck className="size-5" />,
    color: "oklch(0.36 0.05 178)",
    initials: "JO",
  },
  {
    id: "doctor",
    name: "Dr. Eddy-okoye Kosiso",
    title: "Senior Consultant Physician",
    description: "Patient folders, consultations, diagnoses, prescriptions, and investigation orders.",
    icon: <Stethoscope className="size-5" />,
    color: "oklch(0.55 0.07 178)",
    initials: "EK",
  },
  {
    id: "admin",
    name: "Joseph Sinai Bellomy",
    title: "Front Desk & Registration",
    description: "Central intake — registration, billing, payment verification, and department dispatch.",
    icon: <Receipt className="size-5" />,
    color: "oklch(0.55 0.14 145)",
    initials: "JB",
  },
];

/**
 * LoginModal — when `role` prop is provided, the modal is LOCKED to that
 * specific role (the user only sees their own role's identity and password
 * field, never the other two). When `role` is omitted, the user can pick
 * from all 3 roles (legacy behavior — kept for the top-bar "Sign in" button
 * on the landing page header).
 */
export function LoginModal({
  open,
  onOpenChange,
  role: lockedRole,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role?: Role;
}) {
  const login = useDHOIP((s) => s.login);
  // When lockedRole is provided, the modal is locked to that role.
  // We derive selectedRole directly from lockedRole when locked (no state needed).
  // When not locked, we use a local state for the role picker.
  const [pickedRole, setPickedRole] = useState<Role>("director");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = lockedRole || pickedRole;
  const selected = roles.find((r) => r.id === selectedRole)!;
  const isLocked = Boolean(lockedRole);

  const submit = () => {
    const result = login(selectedRole, password);
    if (result.ok) {
      toast.success(`Welcome back, ${selected.name.split(" ").slice(-1)[0]}.`, {
        description: `${selected.title} workspace is loading…`,
      });
      setPassword("");
      setError(null);
      onOpenChange(false);
    } else {
      setError(result.error || "Login failed");
      toast.error("Login failed", { description: result.error });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header — hairline divided, no colored band */}
        <div className="px-6 pt-6 pb-5 hairline-b">
          <div className="flex items-center gap-2.5">
            <img
              src="/dare2care-logo.jpg"
              alt="Dare2Care logo"
              className="h-7 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[12px] text-slate">Secure sign-in</span>
          </div>
          <DialogTitle className="mt-4 text-[22px] font-semibold tracking-tight">
            {isLocked ? selected.title : "Choose your workspace"}
          </DialogTitle>
          <p className="mt-1 text-[13px] text-slate">
            {isLocked
              ? `Enter your password to access the ${selected.title} workspace.`
              : "Select a role and enter the demo password to continue."}
          </p>
        </div>

        <div className="p-6">
          {/* Role selector — sharp list, not rounded cards */}
          {!isLocked && (
            <div className="hairline-t hairline-b -mx-6 mb-5">
              {roles.map((r) => {
                const isSel = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => { setPickedRole(r.id); setError(null); setPassword(""); }}
                    className={`group flex w-full items-center gap-3 px-6 py-3 text-left hairline-b transition-colors ${
                      isSel ? "bg-surface" : "hover:bg-surface"
                    }`}
                  >
                    <div className="text-primary shrink-0">{r.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight">{r.name}</p>
                      <p className="text-[12px] text-slate mt-0.5">{r.title}</p>
                    </div>
                    <div className={`size-3 shrink-0 ${isSel ? "bg-primary" : "hairline border"}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* When locked, show the role identity (read-only) */}
          {isLocked && (
            <div className="hairline-b pb-4 mb-5 flex items-center gap-3">
              <div className="text-primary shrink-0">{selected.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-tight">{selected.name}</p>
                <p className="text-[12px] text-slate mt-0.5">{selected.title}</p>
              </div>
              <span className="text-[11px] text-slate tabular">{selected.id}</span>
            </div>
          )}

          {/* Password field */}
          <div>
            <Label htmlFor="login-password" className="text-[12px] text-slate">
              Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                className="h-10 pl-10 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-[12px] text-crimson">{error}</p>
            )}
            <p className="mt-1.5 text-[12px] text-slate">
              Demo password: <span className="tabular font-semibold text-foreground">123</span>
            </p>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} className="gap-1.5">
              Sign in <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
