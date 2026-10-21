"use client";

import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

// Clinical Chart status indicators: flat, sharp, no rounded-full pills.
// A small colored block + label, like a chart annotation.

const statusStyles: Record<RequestStatus, { label: string; cls: string; block: string }> = {
  draft: { label: "Draft", cls: "text-slate", block: "bg-slate" },
  pending_billing: { label: "Pending billing", cls: "text-slate", block: "bg-slate" },
  pending_payment: { label: "Awaiting payment", cls: "text-crimson", block: "bg-crimson" },
  authorized: { label: "Authorized", cls: "text-primary", block: "bg-primary" },
  dispatched: { label: "Dispatched", cls: "text-primary", block: "bg-primary" },
  in_progress: { label: "In progress", cls: "text-primary", block: "bg-primary" },
  completed: { label: "Completed", cls: "text-primary", block: "bg-primary" },
  cancelled: { label: "Cancelled", cls: "text-crimson", block: "bg-crimson" },
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", s.cls, className)}>
      <span className={cn("size-1.5", s.block)} />
      {s.label}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: "routine" | "urgent" | "stat" }) {
  if (priority === "routine") return null;
  return (
    <span className={cn(
      "inline-flex items-center text-[11px] font-semibold uppercase tracking-wide",
      priority === "stat" ? "text-crimson" : "text-slate"
    )}>
      {priority}
    </span>
  );
}

export function Pill({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "teal" | "crimson";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "text-slate",
    teal: "text-primary",
    crimson: "text-crimson",
  };
  return (
    <span className={cn("inline-flex items-center text-[12px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
