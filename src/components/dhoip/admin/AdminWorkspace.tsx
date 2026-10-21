"use client";

import { useState } from "react";
import { useDHOIP, formatNaira } from "@/lib/store";
import { DEPARTMENTS } from "@/lib/types";
import type { Service, ServiceRequest, Invoice, PaymentMethod, Patient, Receipt as ReceiptType } from "@/lib/types";
import { AppShell, type NavItem } from "../shared/AppShell";
import { SectionHeader } from "../shared/StatCard";
import { StatusBadge, Pill } from "../shared/StatusBadge";
import { PatientAvatar } from "../shared/PatientAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  Receipt,
  Banknote,
  Send,
  Search,
  Plus,
  ChevronRight,
  Users,
  Stethoscope,
  Activity,
  Scan,
  Baby,
  Scissors,
  Eye,
  Microscope,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  ArrowRight,
  Wallet,
  ShieldCheck,
  FileText,
  Printer,
  Calendar,
  Ban,
} from "lucide-react";

const navItems: NavItem[] = [
  { id: "queue", label: "Outpatient Queue", icon: <LayoutDashboard className="size-4" /> },
  { id: "requests", label: "Request Management", icon: <ClipboardList className="size-4" /> },
  { id: "billing", label: "Billing & Invoices", icon: <Receipt className="size-4" /> },
  { id: "payments", label: "Payment Desk", icon: <Banknote className="size-4" /> },
  { id: "receipts", label: "Receipts", icon: <FileText className="size-4" /> },
  { id: "dispatch", label: "Request Dispatch", icon: <Send className="size-4" /> },
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

export function AdminWorkspace() {
  const [active, setActive] = useState("queue");
  const store = useDHOIP();

  // Counters for nav badges
  const pendingBilling = store.requests.filter((r) => r.status === "pending_billing").length;
  const pendingPayment = store.invoices.filter((i) => i.status === "unpaid" || i.status === "hmo_pending").length;
  const authorizedReqs = store.requests.filter((r) => r.status === "authorized").length;

  const items = navItems.map((n) => {
    if (n.id === "requests") return { ...n, badge: pendingBilling };
    if (n.id === "payments") return { ...n, badge: pendingPayment };
    if (n.id === "dispatch") return { ...n, badge: authorizedReqs };
    return n;
  });

  return (
    <AppShell role="admin" navItems={items} activeId={active} onNavigate={setActive}>
      {active === "queue" && <OutpatientQueue />}
      {active === "requests" && <RequestManagement />}
      {active === "billing" && <BillingPanel />}
      {active === "payments" && <PaymentDesk />}
      {active === "receipts" && <ReceiptsPanel />}
      {active === "dispatch" && <DispatchPanel />}
    </AppShell>
  );
}

function OutpatientQueue() {
  const store = useDHOIP();
  const [q, setQ] = useState("");
  const todaysEncounters = store.encounters.filter((e) => e.date.startsWith("2026-10-21"));

  const queue = todaysEncounters.map((e) => {
    const p = store.patients.find((x) => x.id === e.patientId)!;
    const reqs = store.requests.filter((r) => r.encounterId === e.id);
    const status = reqs.length === 0 ? "awaiting_action" : reqs.some((r) => r.status === "pending_billing") ? "needs_billing" : reqs.some((r) => r.status === "pending_payment") ? "needs_payment" : reqs.some((r) => r.status === "authorized" || r.status === "dispatched") ? "in_progress" : "completed";
    return { enc: e, patient: p, reqs, status };
  });

  const filtered = queue.filter((x) => {
    const term = q.toLowerCase();
    return (
      x.patient.firstName.toLowerCase().includes(term) ||
      x.patient.lastName.toLowerCase().includes(term) ||
      x.patient.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Outpatient queue"
        description="View every patient waiting for registration, request capture, or billing today. The starting point of the Admin/Billing workflow."
        action={
          <div className="flex items-center gap-2">
            <RegisterWalkInDialog />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <QueueStat label="In queue" value={queue.length} tone="teal" />
        <QueueStat label="Needs billing" value={queue.filter((x) => x.status === "needs_billing").length} tone="crimson" />
        <QueueStat label="Awaiting payment" value={queue.filter((x) => x.status === "needs_payment").length} tone="crimson" />
        <QueueStat label="Completed" value={queue.filter((x) => x.status === "completed").length} tone="teal" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient name or ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input h-10 pl-10 text-sm"
        />
      </div>

      <div className="space-y-2.5">
        {filtered.map((x) => {
          const dept = DEPARTMENTS.find((d) => d.code === x.enc.department);
          return (
            <div key={x.enc.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-none border border-border bg-card p-4">
              <PatientAvatar patient={x.patient} size="md" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{x.patient.firstName} {x.patient.lastName}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{x.patient.id}</span>
                  <Pill tone="slate"><span className="capitalize">{x.enc.type}</span></Pill>
                  {x.patient.hmoPlan && <Pill tone="teal">{x.patient.hmoPlan}</Pill>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dept?.name} · {new Date(x.enc.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  {x.enc.chiefComplaint && ` · ${x.enc.chiefComplaint}`}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <QueueStatusPill status={x.status} />
                {x.reqs.length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">{x.reqs.length} request(s)</p>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // For demo, jump to requests tab visually by triggering toast
                  toast.info(`Open ${x.patient.firstName}'s encounter ${x.enc.id} in Request Management.`);
                }}
              >
                Open <ChevronRight className="size-3.5" />
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No patients in queue.
          </div>
        )}
      </div>
    </div>
  );
}

function QueueStat({ label, value, tone }: { label: string; value: number; tone: "teal" | "crimson" | "slate" }) {
  const toneCls: Record<string, string> = {
    teal: "text-primary",
    crimson: "text-crimson",
    slate: "text-slate",
  };
  return (
    <div className="hairline border bg-card p-4">
      <p className="text-[12px] text-slate">{label}</p>
      <p className={cn("mt-1.5 text-3xl font-semibold tabular", toneCls[tone])}>{value}</p>
    </div>
  );
}

function QueueStatusPill({ status }: { status: string }) {
  if (status === "completed") return <Pill tone="teal">Completed</Pill>;
  if (status === "in_progress") return <Pill tone="teal">In progress</Pill>;
  if (status === "needs_payment") return <Pill tone="crimson">Needs payment</Pill>;
  if (status === "needs_billing") return <Pill tone="crimson">Needs billing</Pill>;
  return <Pill tone="slate">Awaiting action</Pill>;
}

function RegisterWalkInDialog() {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [existingId, setExistingId] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "Female" as "Male" | "Female",
    phone: "", address: "", city: "Lagos", state: "Lagos", nextOfKin: "", nextOfKinPhone: "",
    bloodGroup: "NULL", genotype: "NULL",
  });
  const [encType, setEncType] = useState<"outpatient" | "emergency" | "inpatient">("outpatient");
  const [dept, setDept] = useState<string>("consultation");
  const [complaint, setComplaint] = useState("");

  const submit = () => {
    let patientId: string;
    if (mode === "existing") {
      const p = store.patients.find((x) => x.id === existingId);
      if (!p) {
        toast.error("Patient not found. Check the ID or register as new.");
        return;
      }
      patientId = p.id;
    } else {
      if (!form.firstName || !form.lastName || !form.phone) {
        toast.error("Fill in name and phone.");
        return;
      }
      const p = store.registerPatient({ ...form, allergies: [] });
      patientId = p.id;
    }
    const enc = store.openEncounter({
      patientId,
      date: new Date().toISOString(),
      department: dept as any,
      type: encType,
      chiefComplaint: complaint,
    });
    toast.success(`Encounter ${enc.id} opened for ${patientId}.`);
    setOpen(false);
    setComplaint("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Walk-in intake
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Register walk-in patient & open encounter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="text-xs">Existing patient</TabsTrigger>
              <TabsTrigger value="new" className="text-xs">New registration</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="mt-3">
              <Label className="text-xs">Patient ID</Label>
              <Input className="mt-1" value={existingId} onChange={(e) => setExistingId(e.target.value)} placeholder="D2C-000125" />
              <p className="mt-1 text-[11px] text-muted-foreground">Search by patient ID. Existing master folder will be reused.</p>
            </TabsContent>
            <TabsContent value="new" className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name *"><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
                <Field label="Last name *"><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
                <Field label="Date of birth *"><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
                <Field label="Gender">
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "Male" | "Female" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 803 555 0142" /></Field>
                <Field label="Next of kin"><Input value={form.nextOfKin} onChange={(e) => setForm({ ...form, nextOfKin: e.target.value })} /></Field>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
            <Field label="Encounter type">
              <Select value={encType} onValueChange={(v) => setEncType(v as "outpatient" | "emergency" | "inpatient")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outpatient">Outpatient</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="inpatient">Inpatient</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Department">
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Reason for visit / chief complaint">
            <Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Direct outpatient ultrasound request — pelvic pain." className="min-h-16" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Open encounter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestManagement() {
  const store = useDHOIP();
  const [filter, setFilter] = useState<"all" | "pending_billing" | "pending_payment" | "authorized">("pending_billing");

  const requests = store.requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Request management"
        description="Capture outpatient requests and receive doctors' orders. Each request moves through billing → payment → authorization → dispatch."
      />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "pending_billing", label: "Pending billing" },
          { id: "pending_payment", label: "Awaiting payment" },
          { id: "authorized", label: "Authorized — ready to dispatch" },
          { id: "all", label: "All requests" },
        ].map((t) => {
          const count = t.id === "all" ? store.requests.length : store.requests.filter((r) => r.status === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/40"
              )}
            >
              {t.label} <span className="ml-1 tabular opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {requests.map((r) => {
          const p = store.patients.find((x) => x.id === r.patientId);
          const req = store.staff.find((s) => s.id === r.requestedBy);
          const inv = store.invoices.find((i) => i.id === r.invoiceId);
          return (
            <div key={r.id} className="rounded-none border border-border bg-card p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
                    <span className="text-[11px] text-slate tabular">
                      {new Date(r.requestedAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <StatusBadge status={r.status} />
                    {r.priority !== "routine" && (
                      <span className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        r.priority === "stat" ? "border-rose-300 bg-rose-100 text-rose-700" : "border-amber-300 bg-amber-100 text-amber-700"
                      )}>{r.priority}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{r.serviceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p ? `${p.firstName} ${p.lastName}` : "—"} · <span className="font-mono">{p?.id}</span>
                    {" · "}requested by {req?.name || r.requestedBy}
                  </p>
                  {r.clinicalNote && <p className="mt-1 text-[11px] italic text-muted-foreground">{r.clinicalNote}</p>}
                </div>

                <div className="text-sm">
                  {inv ? (
                    <div className="rounded-lg border border-border p-2.5">
                      <p className="font-mono text-[10px] text-muted-foreground">{inv.id}</p>
                      <p className="font-semibold tabular">{formatNaira(inv.total)}</p>
                      <Pill tone={inv.status === "paid" ? "emerald" : inv.status === "hmo_pending" ? "amber" : "copper"}>
                        {inv.status.replace("_", " ")}
                      </Pill>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">No invoice yet</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  {r.status === "pending_billing" && (
                    <CreateInvoiceButton requestId={r.id} />
                  )}
                  {r.status === "pending_payment" && (
                    <Button size="sm" variant="outline" onClick={() => toast.info("Open Payment Desk to record payment.")}>
                      <Banknote className="size-3.5" /> Take payment
                    </Button>
                  )}
                  {r.status === "authorized" && (
                    <DispatchButton requestId={r.id} />
                  )}
                  {(r.status === "dispatched" || r.status === "in_progress" || r.status === "completed") && (
                    <Pill tone="slate">In department queue</Pill>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No requests in this view.
          </div>
        )}
      </div>
    </div>
  );
}

function CreateInvoiceButton({ requestId }: { requestId: string }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const req = store.requests.find((r) => r.id === requestId)!;
  const patient = store.patients.find((p) => p.id === req.patientId)!;
  const service = store.services.find((s) => s.id === req.serviceId)!;
  const [discount, setDiscount] = useState(0);
  const [hmoId, setHmoId] = useState(patient.hmoId || "none");

  const total = Math.max(0, service.price - discount);

  const create = () => {
    store.createInvoice({
      patientId: patient.id,
      encounterId: req.encounterId,
      lines: [{ serviceId: service.id, serviceName: service.name, quantity: 1, unitPrice: service.price - discount, total }],
      relatedRequests: [req.id],
      hmoId: hmoId === "none" ? undefined : hmoId,
    });
    toast.success(`Invoice created for ${req.id}. Awaiting payment.`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Receipt className="size-3.5" /> Create invoice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create invoice · {req.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Patient</p>
            <p className="text-sm font-medium">{patient.firstName} {patient.lastName} · <span className="font-mono">{patient.id}</span></p>
            {patient.hmoPlan && <p className="text-[11px] text-muted-foreground">HMO: {patient.hmoPlan}</p>}
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="text-sm font-medium">{service.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{service.department} · {service.category}</p>
              </div>
              <p className="text-lg font-semibold tabular">{formatNaira(service.price)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="HMO assignment">
              <Select value={hmoId} onValueChange={setHmoId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — self-pay</SelectItem>
                  {store.hmos.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name} · {h.coveragePercent}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Discount (₦)">
              <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </Field>
          </div>
          {hmoId !== "none" && (() => {
            const hmo = store.hmos.find((h) => h.id === hmoId)!;
            const hmoShare = Math.round(total * (hmo.coveragePercent / 100));
            const patientShare = total - hmoShare;
            return (
              <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs">
                <p className="font-semibold text-amber-800">HMO split</p>
                <div className="mt-1 grid grid-cols-3 gap-2 text-amber-900">
                  <div><p className="text-[10px]">Patient share</p><p className="font-semibold tabular">{formatNaira(patientShare)}</p></div>
                  <div><p className="text-[10px]">HMO share</p><p className="font-semibold tabular">{formatNaira(hmoShare)}</p></div>
                  <div><p className="text-[10px]">Pre-auth</p><p className="font-semibold">{hmo.requiresPreAuth ? "Required" : "Not required"}</p></div>
                </div>
              </div>
            );
          })()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={create}>Create invoice · {formatNaira(total)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DispatchButton({ requestId }: { requestId: string }) {
  const store = useDHOIP();
  const req = store.requests.find((r) => r.id === requestId)!;
  const handle = () => {
    store.updateRequestStatus(requestId, "dispatched", { releasedAt: new Date().toISOString() });
    store.addAlert({
      severity: "info",
      category: "operations",
      message: `Request ${requestId} dispatched to ${req.department}.`,
    });
    toast.success(`Released ${requestId} to ${req.department}.`);
  };
  return (
    <Button size="sm" onClick={handle}>
      <Send className="size-3.5" /> Dispatch to {req.department}
    </Button>
  );
}

function BillingPanel() {
  const store = useDHOIP();
  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Invoices & financial status"
        description="Every billable service connects to its invoice and financial transaction. Payment, HMO authorization, and outstanding balances are tracked separately."
      />
      {store.invoices.length === 0 ? (
        <div className="hairline border bg-card p-8 text-center">
          <Receipt className="mx-auto size-6 text-slate" />
          <p className="mt-2 text-sm text-slate">No invoices yet.</p>
          <p className="text-xs text-slate mt-1">Create a request and invoice it to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {store.invoices.map((inv) => {
            const p = store.patients.find((x) => x.id === inv.patientId);
            return (
              <div key={inv.id} className="hairline border bg-card p-5">
                {/* Top row: invoice ID + date + status */}
                <div className="flex flex-wrap items-center justify-between gap-3 hairline-b pb-3">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[13px] font-medium">{inv.id}</span>
                    <span className="text-[12px] text-slate tabular">
                      {new Date(inv.date).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <Pill tone={inv.status === "paid" ? "teal" : inv.status === "hmo_pending" ? "crimson" : inv.status === "partial" ? "crimson" : "crimson"}>
                    {inv.status.replace("_", " ")}
                  </Pill>
                </div>
                {/* Middle row: patient + services */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 py-3">
                  <div>
                    <p className="text-[12px] text-slate">Patient</p>
                    <p className="text-[14px] font-medium mt-0.5">{p ? `${p.firstName} ${p.lastName}` : "—"}</p>
                    <p className="font-mono text-[11px] text-slate mt-0.5">{inv.patientId}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[12px] text-slate">Services</p>
                    <p className="text-[13px] mt-0.5">{inv.lines.map((l) => l.serviceName).join(", ")}</p>
                    <p className="text-[11px] text-slate mt-0.5 capitalize">{inv.paymentMethod || "—"} · {inv.paymentRef || "—"}</p>
                  </div>
                </div>
                {/* Bottom row: financial breakdown */}
                <div className="hairline-t pt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] text-slate">Total</p>
                    <p className="text-[14px] font-semibold tabular mt-0.5">{formatNaira(inv.total)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate">Patient share</p>
                    <p className="text-[14px] tabular mt-0.5">{formatNaira(inv.patientShare)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate">HMO share</p>
                    <p className="text-[14px] tabular mt-0.5">{inv.hmoShare ? formatNaira(inv.hmoShare) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate">Collected</p>
                    <p className="text-[14px] font-semibold tabular mt-0.5 text-primary">{formatNaira(inv.amountPaid)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentDesk() {
  const store = useDHOIP();
  const unpaidInvoices = store.invoices.filter((i) => i.status !== "paid" && i.status !== "void");

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Payment verification"
        description="Record cash, POS, and verified bank transfers. A bank transfer cannot be marked received from a screenshot alone — it must be verified against the approved process."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <PayStat label="Awaiting payment" value={unpaidInvoices.length} sub={`${formatNaira(unpaidInvoices.reduce((s, i) => s + i.outstanding, 0))} outstanding`} tone="crimson" />
        <PayStat label="Verified today" value={store.invoices.filter((i) => i.paidAt?.startsWith("2026-10-21")).length} sub={`${formatNaira(store.invoices.filter((i) => i.paidAt?.startsWith("2026-10-21")).reduce((s, i) => s + i.amountPaid, 0))} collected`} tone="teal" />
        <PayStat label="HMO pre-auth pending" value={store.invoices.filter((i) => i.status === "hmo_pending").length} sub="Awaiting authorization" tone="crimson" />
      </div>

      <div className="space-y-2.5">
        {unpaidInvoices.map((inv) => {
          const p = store.patients.find((x) => x.id === inv.patientId);
          return (
            <div key={inv.id} className="rounded-none border border-border bg-card p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_auto_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{inv.id}</span>
                    <span className="text-[11px] text-slate tabular">
                      {new Date(inv.date).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Pill tone={inv.status === "hmo_pending" ? "crimson" : "crimson"}>{inv.status.replace("_", " ")}</Pill>
                  </div>
                  <p className="mt-1 text-sm font-medium">{p ? `${p.firstName} ${p.lastName}` : "—"} · <span className="font-mono text-xs">{p?.id}</span></p>
                  <p className="text-[11px] text-muted-foreground">{inv.lines.map((l) => l.serviceName).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</p>
                  <p className="text-xl font-semibold tabular">{formatNaira(inv.outstanding)}</p>
                  {inv.hmoShare > 0 && (
                    <p className="text-[10px] text-muted-foreground">HMO: {formatNaira(inv.hmoShare)} · Patient: {formatNaira(inv.patientShare)}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {inv.status === "hmo_pending" && <VerifyHMOButton invoiceId={inv.id} />}
                  <RecordPaymentButton invoiceId={inv.id} />
                </div>
              </div>
            </div>
          );
        })}
        {unpaidInvoices.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="mx-auto size-6 text-emerald-500" />
            <p className="mt-2">All invoices paid. Cashier desk is clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PayStat({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: "teal" | "crimson" | "slate" }) {
  const toneCls: Record<string, string> = {
    teal: "text-primary",
    crimson: "text-crimson",
    slate: "text-slate",
  };
  return (
    <div className="hairline border bg-card p-4">
      <p className="text-[12px] text-slate">{label}</p>
      <p className={cn("mt-1.5 text-3xl font-semibold tabular", toneCls[tone])}>{value}</p>
      <p className="text-[12px] text-slate tabular">{sub}</p>
    </div>
  );
}

function RecordPaymentButton({ invoiceId }: { invoiceId: string }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [ref, setRef] = useState("");
  const inv = store.invoices.find((i) => i.id === invoiceId)!;

  const submit = () => {
    if (!ref) {
      toast.error("Reference required. POS/transfer needs a verifiable transaction ref.");
      return;
    }
    store.recordPayment(invoiceId, { method, ref, cashierId: store.activeStaffId || "EMP-003", amountPaid: inv.patientShare });
    toast.success(`Payment recorded · ${method.toUpperCase()} ${formatNaira(inv.patientShare)}`);
    setOpen(false);
    setRef("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Banknote className="size-3.5" /> Record payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment · {inv.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Patient share</span><span className="font-semibold tabular">{formatNaira(inv.patientShare)}</span></div>
            {inv.hmoShare > 0 && <div className="flex justify-between mt-1"><span className="text-muted-foreground">HMO share</span><span className="tabular">{formatNaira(inv.hmoShare)}</span></div>}
            <div className="flex justify-between mt-1 pt-1 border-t border-border"><span className="font-medium">To collect</span><span className="text-lg font-semibold tabular">{formatNaira(inv.patientShare)}</span></div>
          </div>
          <Field label="Payment method">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="transfer">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Transaction reference">
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={method === "cash" ? "CASH-20261021-0091" : method === "pos" ? "POS-REF-8829301" : "GTB-TRF-9920134"}
            />
          </Field>
          {method === "transfer" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3 text-xs text-rose-800">
              <p className="font-semibold">Critical control</p>
              <p className="mt-0.5">A bank transfer cannot be marked received from a screenshot alone. Verify against the approved payment-verification process before recording.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Record {formatNaira(inv.patientShare)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VerifyHMOButton({ invoiceId }: { invoiceId: string }) {
  const store = useDHOIP();
  const inv = store.invoices.find((i) => i.id === invoiceId)!;
  const handle = () => {
    store.verifyHMOAuth(invoiceId, inv.hmoShare);
    store.addAlert({
      severity: "info",
      category: "claims",
      message: `HMO authorization verified for ${invoiceId} — ${formatNaira(inv.hmoShare)}.`,
    });
    toast.success(`HMO authorization verified for ${invoiceId}.`);
  };
  return (
    <Button size="sm" variant="outline" onClick={handle}>
      <ShieldCheck className="size-3.5" /> Verify HMO auth
    </Button>
  );
}

function DispatchPanel() {
  const store = useDHOIP();
  const authorizedReqs = store.requests.filter((r) => r.status === "authorized" || r.status === "dispatched" || r.status === "in_progress");
  const byDept = DEPARTMENTS.map((d) => ({
    dept: d,
    items: authorizedReqs.filter((r) => r.department === d.code),
  }));

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Release authorized requests"
        description="Paid or HMO-authorized requests are released to their assigned department. Each department sees the request appear in its live queue."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {byDept.map(({ dept, items }) => (
          <div key={dept.code} className="hairline border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {deptIcons[dept.code]}
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{dept.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{items.length} in queue</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">No requests in queue.</p>
              )}
              {items.map((r) => {
                const p = store.patients.find((x) => x.id === r.patientId);
                return (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium">{r.serviceName}</p>
                    <p className="text-[11px] text-muted-foreground">{p?.firstName} {p?.lastName} · {p?.id}</p>
                    {r.status === "authorized" && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          store.updateRequestStatus(r.id, "dispatched", { releasedAt: new Date().toISOString() });
                          toast.success(`Released to ${dept.name}`);
                        }}
                      >
                        <Send className="size-3.5" /> Release to {dept.name}
                      </Button>
                    )}
                    {(r.status === "dispatched" || r.status === "in_progress") && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Released {r.releasedAt && new Date(r.releasedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                        {r.assignedTo && ` · assigned to ${store.staff.find((s) => s.id === r.assignedTo)?.name}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ===========================================================================
// RECEIPTS PANEL
// ===========================================================================
// A receipt is issued AFTER payment is collected. Multiple paid invoices for
// the same patient (typically on the same day) can be combined into ONE
// receipt. The receipt uses service names (e.g. "Chest X-ray") as the reason
// for payment — not invoice IDs.

function ReceiptsPanel() {
  const store = useDHOIP();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<ReceiptType | null>(null);

  const receipts = store.receipts;

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Payment receipts"
        description="Combine one or more paid invoices for the same patient into a single receipt. The receipt describes the reason for payment using service names — not invoice numbers."
        action={
          <GenerateReceiptDialog
            open={generateOpen}
            onOpenChange={setGenerateOpen}
            onIssued={(r) => setViewReceipt(r)}
          />
        }
      />

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ReceiptStat
          label="Receipts issued"
          value={receipts.filter((r) => r.status === "issued").length}
          tone="teal"
        />
        <ReceiptStat
          label="Total receipted"
          value={formatNaira(receipts.filter((r) => r.status === "issued").reduce((s, r) => s + r.amountPaid, 0))}
          tone="teal"
        />
        <ReceiptStat
          label="Voided"
          value={receipts.filter((r) => r.status === "void").length}
          tone="crimson"
        />
      </div>

      {/* Receipts list */}
      <div className="hairline border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">All issued receipts</h3>
          </div>
          <GenerateReceiptDialog
            open={generateOpen}
            onOpenChange={setGenerateOpen}
            onIssued={(r) => setViewReceipt(r)}
            trigger
          />
        </div>

        <div className="space-y-2.5">
          {receipts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <FileText className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No receipts issued yet.</p>
              <p className="text-xs text-muted-foreground">Click "Generate receipt" to combine paid invoices for a patient into a single receipt.</p>
            </div>
          )}
          {receipts.map((r) => {
            const patient = store.patients.find((p) => p.id === r.patientId);
            return (
              <div
                key={r.id}
                className={cn(
                  "grid grid-cols-1 gap-3 rounded-none border p-4 sm:grid-cols-[1.2fr_2fr_auto_auto] sm:items-center",
                  r.status === "void" && "opacity-50 bg-muted/30"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <Pill tone={r.status === "issued" ? "emerald" : "rose"}>{r.status}</Pill>
                  </div>
                  <p className="mt-1 text-sm font-medium">{r.patientName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{r.patientId}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reason for payment</p>
                  <p className="text-sm text-foreground/90">
                    {r.lines.map((l) => l.serviceName).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {r.invoiceIds.length} invoice(s) · {r.invoiceIds.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Collected</p>
                  <p className="text-lg font-semibold tabular">{formatNaira(r.amountPaid)}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{r.paymentMethod} · {r.invoiceDate}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setViewReceipt(r)}>
                    <Eye className="size-3.5" /> View
                  </Button>
                  {r.status === "issued" && patient && (
                    <VoidReceiptButton receiptId={r.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Receipt viewer + print */}
      {viewReceipt && (
        <ReceiptViewDialog receipt={viewReceipt} onClose={() => setViewReceipt(null)} />
      )}
    </div>
  );
}

function ReceiptStat({ label, value, tone }: { label: string; value: string | number; tone: "teal" | "crimson" | "slate" }) {
  const toneCls: Record<string, string> = {
    teal: "text-primary",
    crimson: "text-crimson",
    slate: "text-slate",
  };
  return (
    <div className="hairline border bg-card p-4">
      <p className="text-[12px] text-slate">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular", toneCls[tone])}>{value}</p>
    </div>
  );
}

function VoidReceiptButton({ receiptId }: { receiptId: string }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason for voiding the receipt.");
      return;
    }
    store.voidReceipt(receiptId, reason);
    toast.success(`Receipt ${receiptId} voided.`);
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
          <Ban className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void receipt · {receiptId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            Voiding a receipt marks it as cancelled. The original invoices remain paid. This action is logged in the audit trail.
          </p>
          <Field label="Reason for voiding *">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Issued in error — wrong invoices combined."
              className="min-h-16"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit}>Void receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Generate Receipt Dialog — pick a patient, pick a date, select paid invoices
// for that patient on that date, combine into a single receipt.
// ---------------------------------------------------------------------------

function GenerateReceiptDialog({
  open,
  onOpenChange,
  onIssued,
  trigger,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onIssued: (r: ReceiptType) => void;
  trigger?: boolean;
}) {
  const store = useDHOIP();
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<string>("2026-10-21");
  const [notes, setNotes] = useState("");

  // Filter patients by query (name, ID, or phone)
  const matchingPatients = patientQuery.trim()
    ? store.patients.filter((p) => {
        const q = patientQuery.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.phone.includes(q)
        );
      })
    : store.patients;

  // AUTOMATICALLY include ALL paid invoices for the selected patient on the
  // selected date. The user does NOT pick invoices manually — the system
  // auto-sums everything the patient paid that day and issues a single
  // receipt for that total.
  const eligibleInvoices = selectedPatientId
    ? store.invoices.filter((inv) => {
        if (inv.patientId !== selectedPatientId) return false;
        if (inv.status === "void") return false;
        if (inv.amountPaid === 0 && inv.hmoAuthorized === 0) return false;
        const invDate = inv.date.split("T")[0];
        return invDate === invoiceDate;
      })
    : [];

  const totalCollected = eligibleInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalHmoAuthorized = eligibleInvoices.reduce((s, i) => s + i.hmoAuthorized, 0);

  // Preview the aggregated receipt lines (by service name) — auto-summed
  const previewLines = (() => {
    const lineMap = new Map<string, { qty: number; amount: number }>();
    for (const inv of eligibleInvoices) {
      for (const line of inv.lines) {
        const existing = lineMap.get(line.serviceName);
        if (existing) {
          existing.qty += line.quantity;
          existing.amount += line.total;
        } else {
          lineMap.set(line.serviceName, { qty: line.quantity, amount: line.total });
        }
      }
    }
    return Array.from(lineMap.entries()).map(([name, v]) => ({ name, ...v }));
  })();

  const reset = () => {
    setPatientQuery("");
    setSelectedPatientId(null);
    setNotes("");
  };

  const submit = () => {
    if (!selectedPatientId) {
      toast.error("Select a patient first.");
      return;
    }
    if (eligibleInvoices.length === 0) {
      toast.error(`No paid invoices for this patient on ${invoiceDate}.`);
      return;
    }
    // Auto-issue receipt for the SUM of all paid invoices for that patient on that date.
    const result = store.generateReceipt({
      patientId: selectedPatientId,
      invoiceIds: eligibleInvoices.map((i) => i.id), // ALL eligible — no manual selection
      cashierId: store.activeStaffId || "EMP-003",
      notes: notes.trim() || undefined,
    });
    if (!result.ok || !result.receipt) {
      toast.error("Failed to generate receipt", { description: result.error });
      return;
    }
    toast.success(`Receipt ${result.receipt.id} issued`, {
      description: `${result.receipt.patientName} · ${formatNaira(result.receipt.amountPaid)} collected`,
    });
    onIssued(result.receipt);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      {trigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" /> Generate receipt
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto scroll-area-edit pr-1" style={{ maxHeight: "70vh" }}>
          {/* Info banner */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3 text-xs text-teal-900">
            <p className="font-semibold">How it works</p>
            <p className="mt-0.5">
              Pick a patient → pick the invoice date → the system <strong>automatically combines ALL paid invoices</strong> for
              that patient on that date into a single receipt. No manual selection needed. The receipt shows the
              <strong> service names</strong> (e.g. "Chest X-ray") as the reason for payment — not the invoice numbers.
            </p>
          </div>

          {/* Step 1: pick patient */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 · Select patient</p>
            {!selectedPatientId ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name, ID, or phone…"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    className="search-input h-10 pl-10"
                  />
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-area-edit rounded-lg border border-border">
                  {matchingPatients.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left text-xs last:border-0 hover:bg-muted/40"
                    >
                      <PatientAvatar patient={p} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{p.firstName} {p.lastName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{p.id} · {p.phone}</p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </button>
                  ))}
                  {matchingPatients.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">No patients match "{patientQuery}".</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div>
                  <p className="text-sm font-medium">
                    {store.patients.find((p) => p.id === selectedPatientId)?.firstName}{" "}
                    {store.patients.find((p) => p.id === selectedPatientId)?.lastName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">{selectedPatientId}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedPatientId(null)}>
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: pick date */}
          {selectedPatientId && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 · Invoice date</p>
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="search-input h-10 pl-10"
                />
              </div>
            </div>
          )}

          {/* Step 3: auto-summary — no manual selection */}
          {selectedPatientId && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step 3 · Auto-summary ({eligibleInvoices.length} paid invoice(s) on {invoiceDate})
              </p>
              {eligibleInvoices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No paid invoices for this patient on {invoiceDate}. Try a different date.
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-1.5 pr-2 font-medium">Reason for payment</th>
                        <th className="pb-1.5 px-2 text-right font-medium">Qty</th>
                        <th className="pb-1.5 pl-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewLines.map((l) => (
                        <tr key={l.name} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 pr-2">{l.name}</td>
                          <td className="py-1.5 px-2 text-right tabular">{l.qty}</td>
                          <td className="py-1.5 pl-2 text-right tabular">{formatNaira(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border">
                        <td className="pt-2 font-semibold" colSpan={2}>Total collected</td>
                        <td className="pt-2 text-right text-base font-semibold tabular text-emerald-700">
                          {formatNaira(totalCollected)}
                        </td>
                      </tr>
                      {totalHmoAuthorized > 0 && (
                        <tr>
                          <td className="pt-1 text-muted-foreground" colSpan={2}>HMO authorized</td>
                          <td className="pt-1 text-right tabular text-amber-700">{formatNaira(totalHmoAuthorized)}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Source invoices: {eligibleInvoices.map((i) => i.id).join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optional notes */}
          {eligibleInvoices.length > 0 && (
            <Field label="Notes (optional)">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Combined bill for today's consultation + lab tests."
              />
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={eligibleInvoices.length === 0}>
            <Printer className="size-4" />
            Issue & print receipt for {formatNaira(totalCollected)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Receipt View Dialog — printable receipt layout
// ---------------------------------------------------------------------------

function ReceiptViewDialog({ receipt, onClose }: { receipt: ReceiptType; onClose: () => void }) {
  const store = useDHOIP();
  const patient = store.patients.find((p) => p.id === receipt.patientId);

  const handlePrint = () => {
    // Use the browser's native print dialog. The receipt layout below is
    // styled to print cleanly on A4 / letter paper.
    window.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Receipt · {receipt.id}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto scroll-area-edit pr-1" style={{ maxHeight: "70vh" }}>
          <ReceiptDocument receipt={receipt} patient={patient} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} disabled={receipt.status === "void"}>
            <Printer className="size-4" /> Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The actual receipt document — also rendered for print via window.print().
// Uses the .receipt-print CSS scope so we can style it independently when printing.
function ReceiptDocument({
  receipt,
  patient,
}: {
  receipt: ReceiptType;
  patient?: Patient;
}) {
  return (
    <div className="receipt-print rounded-xl border border-border bg-white p-6 text-foreground">
      {/* Header — hospital identity */}
      <div className="flex items-start justify-between border-b-2 border-primary pb-4">
        <div className="flex items-center gap-3">
          <img
            src="/dare2care-logo.jpg"
            alt="Dare2Care logo"
            className="h-12 w-auto rounded"
          />
          <div>
            <p className="text-xl font-semibold tracking-tight">Dare2Care Hospital</p>
            <p className="text-[11px] text-muted-foreground">Isicourt-afara road umuobia umuahia</p>
            <p className="text-[11px] text-muted-foreground">+234 803 555 0142 · hello@dare2care.ng</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight text-primary">PAYMENT RECEIPT</p>
          <p className="mt-1 font-mono text-sm">{receipt.id}</p>
          {receipt.status === "void" && (
            <span className="mt-1 inline-block rounded border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
              VOID
            </span>
          )}
        </div>
      </div>

      {/* Patient + receipt meta */}
      <div className="grid grid-cols-2 gap-4 py-4 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Received from</p>
          <p className="mt-0.5 text-sm font-medium">{receipt.patientName}</p>
          <p className="font-mono text-[11px] text-muted-foreground">Patient ID: {receipt.patientId}</p>
          {patient && (
            <p className="text-[11px] text-muted-foreground">
              {patient.gender} · {patient.phone}
            </p>
          )}
          {receipt.hmoName && (
            <p className="mt-1 text-[11px]">
              <span className="text-muted-foreground">HMO:</span> <span className="font-medium">{receipt.hmoName}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date issued</p>
          <p className="mt-0.5 text-sm font-medium">
            {new Date(receipt.issueDate).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice date</p>
          <p className="text-sm">{new Date(receipt.invoiceDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Services table — uses service names as the reason for payment */}
      <table className="w-full border-t border-border text-xs">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-2 font-semibold">Description (reason for payment)</th>
            <th className="px-2 py-2 text-center font-semibold">Qty</th>
            <th className="px-2 py-2 text-right font-semibold">Unit price</th>
            <th className="px-2 py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((l, idx) => (
            <tr key={idx} className="border-b border-border/40">
              <td className="px-2 py-2 text-foreground">{l.serviceName}</td>
              <td className="px-2 py-2 text-center tabular">{l.quantity}</td>
              <td className="px-2 py-2 text-right tabular">{formatNaira(l.unitPrice)}</td>
              <td className="px-2 py-2 text-right tabular font-medium">{formatNaira(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="px-2 py-2 font-semibold" colSpan={3}>Total services rendered</td>
            <td className="px-2 py-2 text-right tabular font-semibold">{formatNaira(receipt.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Payment summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary/20 p-3 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
          <p className="mt-0.5 text-sm font-medium capitalize">{receipt.paymentMethod}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</p>
          <p className="font-mono text-[11px]">{receipt.paymentRef}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount collected</p>
          <p className="mt-0.5 text-2xl font-semibold tabular text-emerald-700">
            {formatNaira(receipt.amountPaid)}
          </p>
          {receipt.hmoAuthorized > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              HMO authorized: <span className="font-medium text-foreground">{formatNaira(receipt.hmoAuthorized)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Cashier + signatures */}
      <div className="mt-6 grid grid-cols-2 gap-6 border-t border-border pt-4 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issued by</p>
          <p className="mt-0.5 text-sm font-medium">{receipt.cashierName}</p>
          <p className="text-[11px] text-muted-foreground">Front Desk & Administration</p>
          <div className="mt-6 border-t border-dashed border-border pt-1 text-[10px] text-muted-foreground">Signature</div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Patient signature</p>
          <div className="mt-8 border-t border-dashed border-border pt-1 text-[10px] text-muted-foreground">{receipt.patientName}</div>
        </div>
      </div>

      {/* Source invoices — small print for audit traceability */}
      <div className="mt-4 border-t border-border pt-2 text-[10px] text-muted-foreground">
        <p>Source invoices: {receipt.invoiceIds.join(", ")}</p>
        {receipt.notes && <p className="mt-0.5 italic">Notes: {receipt.notes}</p>}
        {receipt.status === "void" && (
          <p className="mt-1 font-semibold text-rose-700">
            VOIDED {receipt.voidedAt && `on ${new Date(receipt.voidedAt).toLocaleString("en-NG")}`} · Reason: {receipt.voidReason}
          </p>
        )}
        <p className="mt-1">This receipt was generated electronically by D-HOIP and is valid without signature.</p>
      </div>
    </div>
  );
}
