"use client";

import { useState } from "react";
import { useDHOIP, formatNaira, type DashboardStats } from "@/lib/store";
import { DEPARTMENTS } from "@/lib/types";
import { AppShell, type NavItem } from "../shared/AppShell";
import { StatCard, SectionHeader } from "../shared/StatCard";
import { Pill } from "../shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  AlertTriangle,
  FileText,
  Users,
  Activity,
  TrendingUp,
  Banknote,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Stethoscope,
  Microscope,
  Scan,
  Baby,
  Scissors,
  Eye,
} from "lucide-react";

const navItems: NavItem[] = [
  { id: "overview", label: "Executive Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "departments", label: "Departments", icon: <Building2 className="size-4" /> },
  { id: "finance", label: "Finance & Revenue", icon: <Wallet className="size-4" /> },
  { id: "alerts", label: "Management Alerts", icon: <AlertTriangle className="size-4" /> },
  { id: "referrals", label: "Referrals", icon: <FileText className="size-4" /> },
  { id: "staff", label: "Staff & Attendance", icon: <Users className="size-4" /> },
];

const deptIcons: Record<string, React.ReactNode> = {
  consultation: <Stethoscope className="size-4" />,
  clinicals: <Activity className="size-4" />,
  laboratory: <Microscope className="size-4" />,
  radiology: <Scan className="size-4" />,
  maternity: <Baby className="size-4" />,
  surgery: <Scissors className="size-4" />,
  eye: <Eye className="size-4" />,
};

export function DirectorWorkspace() {
  const [active, setActive] = useState("overview");
  const store = useDHOIP();
  const stats = store.getDashboardStats();
  const alerts = store.alerts;
  const unackAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <AppShell
      role="director"
      navItems={navItems.map((n) =>
        n.id === "alerts" ? { ...n, badge: unackAlerts.length } : n
      )}
      activeId={active}
      onNavigate={setActive}
      alertsCount={unackAlerts.length}
    >
      {active === "overview" && <Overview stats={stats} />}
      {active === "departments" && <Departments />}
      {active === "finance" && <Finance />}
      {active === "alerts" && <Alerts />}
      {active === "referrals" && <Referrals />}
      {active === "staff" && <StaffAttendance />}
    </AppShell>
  );
}

function Overview({ stats }: { stats: DashboardStats }) {
  const store = useDHOIP();
  const recentAudit = store.audit.slice(0, 6);
  const todayInvoices = store.invoices.filter((i) => i.date.startsWith("2026-10-21"));
  const collectionsBreakdown = todayInvoices.reduce(
    (acc, i) => {
      if (i.paymentMethod === "cash") acc.cash += i.amountPaid;
      else if (i.paymentMethod === "pos") acc.pos += i.amountPaid;
      else if (i.paymentMethod === "transfer") acc.transfer += i.amountPaid;
      if (i.hmoAuthorized) acc.hmo += i.hmoAuthorized;
      return acc;
    },
    { cash: 0, pos: 0, transfer: 0, hmo: 0 }
  );

  return (
    <div className="space-y-8 fade-up">
      <SectionHeader
        title="Good morning, Dir. Ogidi"
        description="Hospital-wide overview as of 21 October 2026, 10:42 WAT. All figures reflect live session data from the central registry."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <span className="font-medium">All systems online</span>
            <span className="text-muted-foreground">· 0 incidents</span>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Patients seen today"
          value={stats.patientsToday}
          sub={`${stats.encountersToday} encounters across 7 departments`}
          icon={<Users className="size-4" />}
          accent="teal"
        />
        <StatCard
          label="Cash collected today"
          value={formatNaira(stats.collectionsToday)}
          sub="Cash · POS · verified transfers"
          icon={<Banknote className="size-4" />}
          accent="emerald"
        />
        <StatCard
          label="Pending requests"
          value={stats.pendingRequests}
          sub="Across all departmental queues"
          icon={<Clock className="size-4" />}
          accent="amber"
        />
        <StatCard
          label="Outstanding claims"
          value={formatNaira(stats.outstandingClaims)}
          sub="From HMO payers · tracked live"
          icon={<ShieldAlert className="size-4" />}
          accent="rose"
        />
      </div>

      {/* Today's collections breakdown + Live alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 hairline border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Collections breakdown</h3>
            </div>
            <Pill tone="teal">
              <CheckCircle2 className="size-3" /> Reconciled
            </Pill>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CollectionTile label="Cash" amount={collectionsBreakdown.cash} tone="teal" />
            <CollectionTile label="POS" amount={collectionsBreakdown.pos} tone="teal" />
            <CollectionTile label="Bank transfer" amount={collectionsBreakdown.transfer} tone="crimson" />
            <CollectionTile label="HMO authorized" amount={collectionsBreakdown.hmo} tone="crimson" />
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Channel distribution</span>
              <span className="font-medium text-foreground">
                Total: {formatNaira(stats.collectionsToday + collectionsBreakdown.hmo)}
              </span>
            </div>
            <ChannelBar cash={collectionsBreakdown.cash} pos={collectionsBreakdown.pos} transfer={collectionsBreakdown.transfer} hmo={collectionsBreakdown.hmo} />
          </div>
        </div>

        {/* Live alerts */}
        <div className="hairline border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Live alerts</h3>
            </div>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
              {store.alerts.filter((a) => !a.acknowledged).length} new
            </span>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto scroll-area-edit pr-1">
            {store.alerts.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className={cn(
                  "hairline border p-3",
                  a.severity === "critical" && "border-crimson/40 bg-crimson/5",
                  a.severity === "warning" && "bg-surface",
                  a.severity === "info" && "bg-surface"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn(
                    "size-1.5",
                    a.severity === "critical" && "bg-crimson",
                    a.severity === "warning" && "bg-slate",
                    a.severity === "info" && "bg-slate"
                  )} />
                  <span className="text-[12px] text-slate">{a.category}</span>
                </div>
                <p className="text-[13px]">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department performance + Recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 hairline border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Activity · Revenue · Pending work</h3>
            </div>
            <Button variant="outline" size="sm" className="text-xs">Last 7 days</Button>
          </div>
          <div className="space-y-2.5">
            {DEPARTMENTS.map((d) => {
              const data = stats.requestsByDept[d.code] || { pending: 0, inProgress: 0, completed: 0 };
              const revenue = stats.revenueByDept[d.code] || 0;
              const total = data.pending + data.inProgress + data.completed;
              return (
                <div key={d.code} className="grid grid-cols-[1.4fr_3fr_auto] items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {deptIcons[d.code]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{total} total · {data.completed} done</p>
                    </div>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div className="bg-amber-400" style={{ width: `${(data.pending / Math.max(total, 1)) * 100}%` }} />
                    <div className="bg-sky-400" style={{ width: `${(data.inProgress / Math.max(total, 1)) * 100}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${(data.completed / Math.max(total, 1)) * 100}%` }} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular">{formatNaira(revenue)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {data.pending > 0 ? `${data.pending} pending` : "clear"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-400" /> In progress</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Completed</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="hairline border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold tracking-tight">Recent activity</h3>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto scroll-area-edit pr-1">
            {recentAudit.map((log) => (
              <div key={log.id} className="relative pl-4">
                <span className="absolute left-0 top-1.5 size-1.5 rounded-full bg-primary" />
                <span className="absolute left-[3px] top-3 h-full w-px bg-border" />
                <p className="text-xs font-medium text-foreground">{log.action}</p>
                <p className="text-[11px] text-muted-foreground">{log.details}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground tabular">
                  {log.actor} · {new Date(log.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionTile({ label, amount, tone }: { label: string; amount: number; tone: "teal" | "crimson" | "slate" }) {
  const toneCls: Record<string, string> = {
    teal: "text-primary",
    crimson: "text-crimson",
    slate: "text-slate",
  };
  return (
    <div className="hairline border bg-card p-3">
      <p className="text-[12px] text-slate">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular", toneCls[tone])}>{formatNaira(amount)}</p>
    </div>
  );
}

function ChannelBar({ cash, pos, transfer, hmo }: { cash: number; pos: number; transfer: number; hmo: number }) {
  const total = cash + pos + transfer + hmo || 1;
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
      <div className="bg-emerald-500" style={{ width: `${(cash / total) * 100}%` }} title={`Cash ${formatNaira(cash)}`} />
      <div className="bg-teal-500" style={{ width: `${(pos / total) * 100}%` }} title={`POS ${formatNaira(pos)}`} />
      <div className="bg-orange-500" style={{ width: `${(transfer / total) * 100}%` }} title={`Transfer ${formatNaira(transfer)}`} />
      <div className="bg-amber-500" style={{ width: `${(hmo / total) * 100}%` }} title={`HMO ${formatNaira(hmo)}`} />
    </div>
  );
}

function Departments() {
  const store = useDHOIP();
  const stats = store.getDashboardStats();
  return (
    <div className="space-y-8 fade-up">
      <SectionHeader
        title="Seven connected departments"
        description="Each department shares the same patient, billing, and operational records. Workflows differ, but the underlying truth is one."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d) => {
          const data = stats.requestsByDept[d.code] || { pending: 0, inProgress: 0, completed: 0 };
          const revenue = stats.revenueByDept[d.code] || 0;
          const onDutyStaff = store.staff.filter((s) => s.department === d.code && s.onDuty);
          return (
            <div key={d.code} className="hairline border bg-card p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {deptIcons[d.code]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{d.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{d.tagline}</p>
                  </div>
                </div>
                <Pill tone="teal">{onDutyStaff.length} on duty</Pill>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-amber-200 bg-amber-50/40 py-2">
                  <p className="text-xl font-semibold tabular text-amber-800">{data.pending}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50/40 py-2">
                  <p className="text-xl font-semibold tabular text-sky-800">{data.inProgress}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In prog</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 py-2">
                  <p className="text-xl font-semibold tabular text-emerald-800">{data.completed}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Done</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] text-muted-foreground">Revenue (today)</span>
                <span className="text-sm font-semibold tabular">{formatNaira(revenue)}</span>
              </div>
              {onDutyStaff.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {onDutyStaff.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px]">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {s.initials}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Finance() {
  const store = useDHOIP();
  const invoices = store.invoices;
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalHmoAuth = invoices.reduce((s, i) => s + i.hmoAuthorized, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.outstanding, 0);
  const totalHmoOut = store.hmos.reduce((s, h) => s + h.outstanding, 0);

  return (
    <div className="space-y-8 fade-up">
      <SectionHeader
        title="One billing engine, every department"
        description="Total service value, amount paid by patient, amount authorized from HMO, and amount actually received — separated so management never mistakes an unpaid claim for cash in hand."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cash collected" value={formatNaira(totalCollected)} icon={<Banknote className="size-4" />} accent="emerald" />
        <StatCard label="HMO authorized" value={formatNaira(totalHmoAuth)} icon={<ShieldAlert className="size-4" />} accent="amber" sub="Awaiting verification & claim" />
        <StatCard label="Patient outstanding" value={formatNaira(totalOutstanding)} icon={<Clock className="size-4" />} accent="rose" />
        <StatCard label="HMO receivables" value={formatNaira(totalHmoOut)} icon={<TrendingUp className="size-4" />} accent="copper" sub="From 3 payers" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 hairline border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold tracking-tight">Recent transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Invoice</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Patient</th>
                  <th className="pb-2 pr-4 text-right font-medium">Total</th>
                  <th className="pb-2 pr-4 text-right font-medium">Paid</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 10).map((inv) => {
                  const p = store.patients.find((x) => x.id === inv.patientId);
                  return (
                    <tr key={inv.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="py-2.5 pr-4 font-mono text-[11px]">{inv.id}</td>
                      <td className="py-2.5 pr-4 tabular text-[11px] text-slate whitespace-nowrap">
                        {new Date(inv.date).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2.5 pr-4">{p ? `${p.firstName} ${p.lastName}` : "—"}</td>
                      <td className="py-2.5 pr-4 text-right tabular">{formatNaira(inv.total)}</td>
                      <td className="py-2.5 pr-4 text-right tabular font-medium">{formatNaira(inv.amountPaid)}</td>
                      <td className="py-2.5 text-right">
                        <Pill tone={inv.status === "paid" ? "teal" : inv.status === "hmo_pending" ? "crimson" : inv.status === "partial" ? "crimson" : "crimson"}>
                          {inv.status.replace("_", " ")}
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hairline border bg-card p-6">
          <h3 className="text-xl font-semibold tracking-tight">Claims & receivables</h3>
          <div className="mt-4 space-y-3">
            {store.hmos.map((h) => (
              <div key={h.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{h.name}</p>
                  <Pill tone={h.outstanding > 100000 ? "rose" : h.outstanding > 0 ? "amber" : "emerald"}>
                    {h.coveragePercent}% cover
                  </Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{h.plan} · {h.memberName}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className={cn("font-semibold tabular", h.outstanding > 100000 ? "text-rose-700" : "text-foreground")}>
                    {formatNaira(h.outstanding)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Alerts() {
  const store = useDHOIP();
  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Operational pulse — needs attention"
        description="Overdue requests, unverified payments, ageing claims, low stock, equipment faults and unresolved incidents. Acknowledge to clear."
        action={<Button variant="outline" size="sm" className="text-xs">Filter by severity</Button>}
      />
      <div className="space-y-2.5">
        {store.alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex items-start gap-4 rounded-xl border p-4 transition-opacity",
              a.acknowledged && "opacity-50",
              a.severity === "critical" && "border-rose-200 bg-rose-50/40",
              a.severity === "warning" && "border-amber-200 bg-amber-50/40",
              a.severity === "info" && "border-border bg-muted/30"
            )}
          >
            <div className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
              a.severity === "critical" && "bg-rose-100 text-rose-700",
              a.severity === "warning" && "bg-amber-100 text-amber-700",
              a.severity === "info" && "bg-muted text-muted-foreground"
            )}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{a.category}</span>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  a.severity === "critical" && "bg-rose-200 text-rose-800",
                  a.severity === "warning" && "bg-amber-200 text-amber-800",
                  a.severity === "info" && "bg-muted text-muted-foreground"
                )}>{a.severity}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{a.message}</p>
              <p className="mt-1 text-[10px] text-muted-foreground tabular">
                {new Date(a.timestamp).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            {!a.acknowledged && (
              <Button size="sm" variant="outline" onClick={() => store.acknowledgeAlert(a.id)} className="text-xs">
                Acknowledge
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Referrals() {
  const store = useDHOIP();
  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Internal, incoming & outgoing referrals"
        description="Three referral types in one register. Commission terms are recorded separately and require approval — never automatic."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {(["incoming", "internal", "outgoing"] as const).map((type) => {
          const count = store.referrals.filter((r) => r.type === type).length;
          const color = type === "incoming" ? "teal" : type === "internal" ? "copper" : "amber";
          return (
            <div key={type} className="hairline border bg-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{type}</p>
              <p className="mt-1 text-3xl font-semibold tabular">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{type} referrals on record</p>
            </div>
          );
        })}
      </div>
      <div className="hairline border bg-card p-6">
        <div className="space-y-3">
          {store.referrals.map((r) => {
            const p = store.patients.find((x) => x.id === r.patientId);
            return (
              <div key={r.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground">{r.id}</p>
                  <Pill tone={r.type === "incoming" ? "teal" : r.type === "internal" ? "copper" : "amber"} className="mt-1 capitalize">
                    {r.type}
                  </Pill>
                </div>
                <div>
                  <p className="text-sm font-medium">{p ? `${p.firstName} ${p.lastName}` : "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.source}</p>
                  <p className="mt-1 text-xs text-foreground/80">→ {r.destination}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground italic">{r.reason}</p>
                </div>
                <div className="text-right">
                  <Pill tone={r.status === "completed" ? "emerald" : r.status === "acknowledged" ? "teal" : "amber"} className="capitalize">
                    {r.status}
                  </Pill>
                  {r.commissionStatus && r.commissionStatus !== "none" && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Commission: <span className="font-medium text-foreground">{formatNaira(r.commission || 0)}</span>
                      <br />
                      <span className="capitalize">{r.commissionStatus.replace("_", " ")}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StaffAttendance() {
  const store = useDHOIP();
  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Who is on duty today"
        description="Every employee has a staff profile and role in the system. Attendance is captured at the central kiosk or department workstation."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="On duty" value={store.staff.filter((s) => s.onDuty).length} icon={<Users className="size-4" />} accent="teal" />
        <StatCard label="Clocked in on time" value={store.attendance.filter((a) => a.status === "on_time").length} icon={<CheckCircle2 className="size-4" />} accent="emerald" />
        <StatCard label="Late arrivals" value={store.attendance.filter((a) => a.status === "late").length} icon={<Clock className="size-4" />} accent="amber" />
        <StatCard label="Departments" value={new Set(store.staff.map((s) => s.department)).size} icon={<Building2 className="size-4" />} accent="copper" />
      </div>
      <div className="hairline border bg-card p-6">
        <h3 className="mb-4 text-xl font-semibold tracking-tight">Clock-in & status</h3>
        <div className="space-y-2">
          {store.staff.map((s) => {
            const att = store.attendance.find((a) => a.staffId === s.id);
            return (
              <div key={s.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-lg border border-border px-4 py-2.5 hover:bg-muted/30">
                <div className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: s.avatarColor }}>
                  {s.initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.title} · {s.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tabular">{att?.clockIn || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{att?.location === "central_kiosk" ? "Central kiosk" : "Dept. workstation"}</p>
                </div>
                <Pill tone={s.onDuty ? (att?.status === "late" ? "amber" : "emerald") : "neutral"}>
                  {s.onDuty ? (att?.status === "late" ? "Late" : "On time") : "Off duty"}
                </Pill>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
