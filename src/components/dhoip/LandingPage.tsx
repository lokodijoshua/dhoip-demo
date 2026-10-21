"use client";

import { useState } from "react";
import { useDHOIP } from "@/lib/store";
import { DEPARTMENTS } from "@/lib/types";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LoginModal } from "./shared/LoginModal";
import {
  Menu,
  X,
  Stethoscope,
  Activity,
  Microscope,
  Scan,
  Baby,
  Scissors,
  Eye,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const deptIcons: Record<string, React.ReactNode> = {
  consultation: <Stethoscope className="size-4" />,
  clinicals: <Activity className="size-4" />,
  laboratory: <Microscope className="size-4" />,
  radiology: <Scan className="size-4" />,
  maternity: <Baby className="size-4" />,
  surgery: <Scissors className="size-4" />,
  eye: <Eye className="size-4" />,
};

const roles = [
  {
    id: "director" as Role,
    name: "Dir. Jonathan C. Ogidi",
    title: "Medical Director",
    desc: "Hospital-wide visibility — KPIs, finance, alerts, oversight.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    id: "doctor" as Role,
    name: "Dr. Eddy-okoye Kosiso",
    title: "Senior Consultant Physician",
    desc: "Patient folders, consultations, diagnoses, investigation orders.",
    icon: <Stethoscope className="size-4" />,
  },
  {
    id: "admin" as Role,
    name: "Joseph Sinai Bellomy",
    title: "Front Desk & Registration",
    desc: "Registration, billing, payment verification, department dispatch.",
    icon: <Lock className="size-4" />,
  },
];

export function LandingPage() {
  const [loginRole, setLoginRole] = useState<Role | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openLogin = (r: Role) => setLoginRole(r);
  const closeLogin = () => setLoginRole(null);

  return (
    <div className="min-h-screen bg-background">
      <LoginModal open={loginRole !== null} onOpenChange={(v) => { if (!v) closeLogin(); }} role={loginRole || undefined} />

      {/* Header — hairline divided, restrained */}
      <header className="sticky top-0 z-40 hairline-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-3">
            <img
              src="/dare2care-logo.jpg"
              alt="Dare2Care"
              className="h-8 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-[13px] font-semibold tracking-tight">Dare2Care D-HOIP</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-[13px]">
            <a href="#top" className="text-foreground hover:text-primary">Home</a>
            <a href="#about" className="text-slate hover:text-foreground">About</a>
            <a href="#departments" className="text-slate hover:text-foreground">Departments</a>
            <a href="#workspaces" className="text-slate hover:text-foreground">Workspaces</a>
            <a href="#contact" className="text-slate hover:text-foreground">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <a href="#workspaces">Sign in</a>
            </Button>
            <button
              className="md:hidden"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Menu"
            >
              {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden hairline-t px-6 py-3">
            <nav className="flex flex-col gap-2 text-[13px]">
              <a href="#top" onClick={() => setMobileNavOpen(false)} className="py-1">Home</a>
              <a href="#about" onClick={() => setMobileNavOpen(false)} className="py-1 text-slate">About</a>
              <a href="#departments" onClick={() => setMobileNavOpen(false)} className="py-1 text-slate">Departments</a>
              <a href="#workspaces" onClick={() => setMobileNavOpen(false)} className="py-1 text-slate">Workspaces</a>
              <a href="#contact" onClick={() => setMobileNavOpen(false)} className="py-1 text-slate">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero — clinical-document open. No image, no centered headline.
          A left-aligned statement, a single line of operational context. */}
      <section id="top" className="hairline-b">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-28">
          <div className="max-w-3xl enter">
            <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] font-semibold tracking-tight leading-[1.05]">
              One connected hospital system, not a collection of apps.
            </h1>
            <p className="mt-6 text-[17px] text-slate leading-relaxed max-w-2xl">
              D-HOIP unifies patient records, billing, departmental workflow, and executive
              intelligence into a single relational platform. Every staff member sees the same
              records, filtered by role.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" asChild>
                <a href="#workspaces">Sign in to a workspace <ChevronRight className="size-4" /></a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#departments">See departments</a>
              </Button>
            </div>
          </div>

          {/* Operational line — a quiet, monospaced data line at the bottom */}
          <div className="mt-16 hairline-t pt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-[12px] text-slate tabular">
            <span>7 departments</span>
            <span>3 staff on duty</span>
            <span>30 services in catalogue</span>
            <span>4 HMO partners</span>
            <span className="text-primary">Live session — 21 Oct 2026</span>
          </div>
        </div>
      </section>

      {/* About — single column, hairline-divided prose */}
      <section id="about" className="hairline-b">
        <div className="mx-auto max-w-[1280px] px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight leading-tight">
                Centralized records, secure access, live operational visibility.
              </h2>
            </div>
            <div>
              <p className="text-[15px] text-slate leading-relaxed max-w-prose">
                D-HOIP should not function as a collection of separate applications for the
                laboratory, maternity, surgery, radiology, and other units. It functions as one
                centralized hospital management system with connected departmental workspaces.
                Every staff member uses the same underlying patient, billing, and operational records.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { t: "One patient identity", d: "A permanent master record with multiple encounters and linked documents." },
                  { t: "One billing engine", d: "Common invoices, receipts, payment methods, claims, financial status." },
                  { t: "One clinical order engine", d: "Requests, departmental assignment, status updates, returned results." },
                  { t: "One staff & access system", d: "Profiles, attendance, role permissions, audit history." },
                ].map((item) => (
                  <div key={item.t} className="hairline-t pt-3">
                    <p className="text-[13px] font-semibold">{item.t}</p>
                    <p className="text-[13px] text-slate mt-1 leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments — a directory list, not cards */}
      <section id="departments" className="hairline-b">
        <div className="mx-auto max-w-[1280px] px-6 py-20">
          <h2 className="text-[28px] font-semibold tracking-tight">Departments</h2>
          <p className="mt-2 text-[14px] text-slate max-w-prose">
            Each department shares the same patient, billing, and operational records. Workflows
            differ, but the underlying truth is one.
          </p>
          <div className="mt-8 hairline-t">
            {DEPARTMENTS.map((d) => (
              <div
                key={d.code}
                className="hairline-b flex items-center gap-4 py-4 hover:bg-surface transition-colors"
              >
                <div className="text-primary shrink-0">{deptIcons[d.code]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{d.name}</p>
                </div>
                <p className="text-[13px] text-slate hidden sm:block">{d.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workspaces — the 3 roles as a list with login CTAs */}
      <section id="workspaces" className="hairline-b">
        <div className="mx-auto max-w-[1280px] px-6 py-20">
          <h2 className="text-[28px] font-semibold tracking-tight">Workspaces</h2>
          <p className="mt-2 text-[14px] text-slate max-w-prose">
            Three role-based workspaces, one connected system. Each one is a complete view of the
            platform, filtered by what the role is permitted to do.
          </p>
          <div className="mt-8 hairline-t">
            {roles.map((r) => (
              <div
                key={r.id}
                className="hairline-b py-6 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="text-primary shrink-0 mt-0.5">{r.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{r.name}</p>
                    <p className="text-[13px] text-slate mt-0.5">{r.title}</p>
                    <p className="text-[13px] text-slate mt-2 max-w-prose">{r.desc}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => openLogin(r.id)}
                >
                  <Lock className="size-3.5" />
                  Sign in
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — quiet, restrained */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight">
                Step into a workspace and explore the demo.
              </h2>
              <p className="mt-2 text-[14px] opacity-85 max-w-prose">
                Every patient, request, service, payment, and referral is traceable within one
                connected hospital system. Sign in to any role with the demo password.
              </p>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="shrink-0 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <a href="#workspaces">Choose a workspace <ArrowRight className="size-4" /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer — minimal, hairline-divided columns */}
      <footer id="contact" className="bg-background">
        <div className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src="/dare2care-logo.jpg"
                  alt="Dare2Care"
                  className="h-7 w-auto"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-[13px] font-semibold">Dare2Care D-HOIP</span>
              </div>
              <p className="mt-3 text-[13px] text-slate leading-relaxed max-w-xs">
                A centralized hospital management system with connected departmental workspaces.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold mb-3">Quick links</p>
              <ul className="space-y-1.5 text-[13px]">
                <li><a href="#top" className="text-slate hover:text-foreground">Home</a></li>
                <li><a href="#about" className="text-slate hover:text-foreground">About</a></li>
                <li><a href="#departments" className="text-slate hover:text-foreground">Departments</a></li>
                <li><a href="#workspaces" className="text-slate hover:text-foreground">Workspaces</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-semibold mb-3">Departments</p>
              <ul className="space-y-1.5 text-[13px]">
                {DEPARTMENTS.map((d) => (
                  <li key={d.code}><a href="#departments" className="text-slate hover:text-foreground">{d.name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-semibold mb-3">Contact</p>
              <ul className="space-y-1.5 text-[13px] text-slate">
                <li>Isicourt-afara road umuobia umuahia</li>
                <li className="tabular">+234 803 555 0142</li>
                <li>hello@dare2care.ng</li>
                <li>24/7 Emergency</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 hairline-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[12px] text-slate">
            <p>© 2026 Dare2Care Hospital. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Data protection</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
