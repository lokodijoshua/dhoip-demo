"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDHOIP } from "@/lib/store";
import type { Role } from "@/lib/types";
import { LogOut, RotateCcw } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

const roleConfig: Record<Role, { name: string; title: string; initials: string; empId: string }> = {
  director: { name: "Dir. Jonathan C. Ogidi", title: "Medical Director", initials: "JO", empId: "EMP-005" },
  doctor: { name: "Dr. Eddy-okoye Kosiso", title: "Senior Consultant Physician", initials: "EK", empId: "EMP-001" },
  admin: { name: "Joseph Sinai Bellomy", title: "Front Desk & Registration", initials: "JB", empId: "EMP-003" },
};

export function AppShell({
  role,
  navItems,
  activeId,
  onNavigate,
  alertsCount,
  children,
}: {
  role: Role;
  navItems: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  alertsCount?: number;
  children: React.ReactNode;
}) {
  const exitRole = useDHOIP((s) => s.exitRole);
  const resetDemo = useDHOIP((s) => s.resetDemo);
  const cfg = roleConfig[role];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — hairline divided, minimal */}
      <header className="sticky top-0 z-30 hairline-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-6 px-5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/dare2care-logo.jpg"
              alt="Dare2Care"
              className="h-8 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <div className="hairline-l pl-3">
              <p className="text-[13px] font-semibold leading-none">D-HOIP</p>
              <p className="text-[10px] text-slate leading-none mt-0.5">{cfg.title}</p>
            </div>
          </div>

          {/* Session meta — inline, no decorative dots */}
          <div className="hidden md:flex items-center gap-3 text-[12px] text-slate">
            <span className="tabular">{cfg.empId}</span>
            <span className="text-hairline">/</span>
            <span className="capitalize">{role} workspace</span>
            <span className="text-hairline">/</span>
            <span className="tabular">21 Oct 2026</span>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            {alertsCount !== undefined && alertsCount > 0 && (
              <span className="text-[12px] text-crimson font-medium tabular">
                {alertsCount} alert{alertsCount !== 1 ? "s" : ""}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDemo}
              className="text-[12px] text-slate hover:text-foreground"
              title="Reset demo to seed state"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <div className="hairline-l pl-3 flex items-center gap-2">
              <span className="text-[12px] font-medium">{cfg.name}</span>
              <Button variant="ghost" size="icon" className="size-7" onClick={exitRole} title="Exit session">
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — hairline divided, sharp nav list */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 hairline-r bg-card overflow-y-auto scroll-area-edit">
          <nav className="py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "group flex w-full items-center gap-3 px-5 py-2.5 text-[13px] transition-colors text-left",
                  activeId === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-surface"
                )}
                title={item.label}
              >
                <span className="shrink-0 opacity-80">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    "text-[11px] tabular",
                    activeId === item.id ? "text-primary-foreground" : "text-crimson"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
