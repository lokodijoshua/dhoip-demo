"use client";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "teal",
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "teal" | "crimson" | "slate";
  className?: string;
}) {
  // Clinical Chart stat card: hairline border, sharp corners, mono numerals,
  // no decorative shadows or gradients. The number is the loudest thing.
  const accentColor: Record<string, string> = {
    teal: "text-primary",
    crimson: "text-crimson",
    slate: "text-slate",
  };
  return (
    <div className={cn("hairline border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-slate">{label}</p>
          <p className={cn("mt-3 text-3xl font-semibold tracking-tight tabular", accentColor[accent])}>
            {value}
          </p>
          {sub && <p className="mt-1.5 text-[12px] text-slate">{sub}</p>}
        </div>
        {icon && (
          <div className={cn("shrink-0", accentColor[accent])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  // Clinical Chart section header: no eyebrow label, just the title.
  // Hairline divider below separates it from content.
  return (
    <div className={cn("hairline-b pb-4 mb-6 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[13px] text-slate max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
