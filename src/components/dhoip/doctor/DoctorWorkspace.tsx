"use client";

import { useState } from "react";
import { useDHOIP, formatNaira } from "@/lib/store";
import { DEPARTMENTS } from "@/lib/types";
import type { Patient, Encounter, Service, ServiceRequest } from "@/lib/types";
import { AppShell, type NavItem } from "../shared/AppShell";
import { SectionHeader } from "../shared/StatCard";
import { StatusBadge, Pill } from "../shared/StatusBadge";
import { PatientAvatar } from "../shared/PatientAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users,
  FolderOpen,
  FileText,
  Microscope,
  Search,
  Stethoscope,
  Plus,
  ChevronRight,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Pill as PillIcon,
  FlaskConical,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2,
} from "lucide-react";

const navItems: NavItem[] = [
  { id: "patients", label: "Patient List", icon: <Users className="size-4" /> },
  { id: "consultations", label: "My Consultations", icon: <Stethoscope className="size-4" /> },
  { id: "results", label: "Results Review", icon: <Microscope className="size-4" /> },
];

export function DoctorWorkspace() {
  const [active, setActive] = useState("patients");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const store = useDHOIP();

  return (
    <AppShell role="doctor" navItems={navItems} activeId={active} onNavigate={setActive}>
      {active === "patients" && (
        <PatientList
          onSelect={(pid) => {
            setSelectedPatientId(pid);
            setActive("folder");
          }}
        />
      )}
      {active === "folder" && selectedPatientId && (
        <PatientFolder patientId={selectedPatientId} onBack={() => setActive("patients")} />
      )}
      {active === "consultations" && (
        <MyConsultations
          onSelect={(pid) => {
            setSelectedPatientId(pid);
            setActive("folder");
          }}
        />
      )}
      {active === "results" && <ResultsReview />}
    </AppShell>
  );
}

function PatientList({ onSelect }: { onSelect: (patientId: string) => void }) {
  const store = useDHOIP();
  const [q, setQ] = useState("");

  const filtered = store.patients.filter((p) => {
    const term = q.toLowerCase();
    return (
      p.id.toLowerCase().includes(term) ||
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  });

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Find a patient"
        description="Search by name, patient ID, or phone number. Each patient has a permanent identifier and a master folder that holds every encounter."
        action={
          <RegisterPatientDialog onCreated={(pid) => onSelect(pid)} />
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, patient ID (D2C-000125), or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input h-11 pl-10 text-sm"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((p) => {
          const encs = store.getPatientEncounters(p.id);
          const lastEnc = encs[0];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-none border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <PatientAvatar patient={p} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.firstName} {p.lastName}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.gender} · {calcAge(p.dateOfBirth)} yrs · {p.bloodGroup} {p.genotype}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {p.hmoPlan && <Pill tone="teal">{p.hmoPlan}</Pill>}
                  {p.allergies.length > 0 && <Pill tone="crimson">Allergy: {p.allergies.join(", ")}</Pill>}
                  {p.alerts.map((a) => <Pill key={a} tone="crimson">{a}</Pill>)}
                  {encs.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      · {encs.length} encounter{encs.length !== 1 ? "s" : ""}
                      {lastEnc && ` · last on ${new Date(lastEnc.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No patients match "{q}".</p>
          </div>
        )}
      </div>
    </div>
  );
}

function calcAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function RegisterPatientDialog({ onCreated }: { onCreated: (patientId: string) => void }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Female" as "Male" | "Female",
    phone: "",
    email: "",
    address: "",
    city: "Lagos",
    state: "Lagos",
    nextOfKin: "",
    nextOfKinPhone: "",
    bloodGroup: "NULL",
    genotype: "NULL",
  });

  const submit = () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.dateOfBirth) {
      toast.error("Please fill in required fields: name, date of birth, phone.");
      return;
    }
    const p = store.registerPatient({
      ...form,
      allergies: [],
    });
    // Also open an encounter
    store.openEncounter({
      patientId: p.id,
      date: new Date().toISOString(),
      department: "consultation",
      type: "outpatient",
      doctorId: "EMP-001",
    });
    toast.success(`Patient registered: ${p.id} — ${p.firstName} ${p.lastName}`);
    setOpen(false);
    onCreated(p.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Register patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register new patient</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="First name *">
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Chidinma" />
          </Field>
          <Field label="Last name *">
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Okafor" />
          </Field>
          <Field label="Date of birth *">
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "Male" | "Female" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone *">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 803 555 0142" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@gmail.com" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Isicourt-afara road umuobia umuahia" />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </Field>
          <Field label="Next of kin">
            <Input value={form.nextOfKin} onChange={(e) => setForm({ ...form, nextOfKin: e.target.value })} />
          </Field>
          <Field label="Next of kin phone">
            <Input value={form.nextOfKinPhone} onChange={(e) => setForm({ ...form, nextOfKinPhone: e.target.value })} />
          </Field>
          <Field label="Blood group">
            <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NULL">— Not specified —</SelectItem>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Genotype">
            <Select value={form.genotype} onValueChange={(v) => setForm({ ...form, genotype: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NULL">— Not specified —</SelectItem>
                {["AA", "AS", "SS", "AC", "SC"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Register & open folder</Button>
        </div>
      </DialogContent>
    </Dialog>
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

function PatientFolder({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const store = useDHOIP();
  const patient = store.patients.find((p) => p.id === patientId);
  const encounters = store.getPatientEncounters(patientId);
  const [selectedEncId, setSelectedEncId] = useState<string | null>(encounters[0]?.id ?? null);
  const [tab, setTab] = useState("overview");

  if (!patient) return null;
  const selectedEnc = encounters.find((e) => e.id === selectedEncId);
  const encRequests = store.requests.filter((r) => r.encounterId === selectedEncId);
  const encInvoices = store.invoices.filter((i) => i.encounterId === selectedEncId);

  return (
    <div className="space-y-6 fade-up">
      {/* Breadcrumb */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ChevronRight className="size-3.5 rotate-180" />
        Back to patient list
      </button>

      {/* Patient header */}
      <div className="hairline border bg-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <PatientAvatar patient={patient} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{patient.firstName} {patient.lastName}</h1>
                <span className="font-mono text-xs text-muted-foreground">{patient.id}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.gender} · {calcAge(patient.dateOfBirth)} yrs · born {new Date(patient.dateOfBirth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Pill tone="slate"><Calendar className="size-3" /> Registered {new Date(patient.registeredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</Pill>
                {patient.bloodGroup && <Pill tone="crimson">Blood: {patient.bloodGroup} {patient.genotype}</Pill>}
                {patient.hmoPlan && <Pill tone="teal">{patient.hmoPlan}</Pill>}
                {patient.allergies.length > 0 && patient.allergies.map((a) => (
                  <Pill key={a} tone="crimson"><AlertCircle className="size-3" /> Allergy: {a}</Pill>
                ))}
                {patient.alerts.map((a) => <Pill key={a} tone="crimson">{a}</Pill>)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ConsultationDialog patientId={patient.id} onCreated={(encId) => { setSelectedEncId(encId); setTab("consultation"); }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
          <InfoLine icon={<Phone className="size-3" />} label="Phone" value={patient.phone} />
          <InfoLine icon={<MapPin className="size-3" />} label="City" value={`${patient.city}, ${patient.state}`} />
          <InfoLine icon={<Users className="size-3" />} label="Next of kin" value={patient.nextOfKin} />
          <InfoLine icon={<Phone className="size-3" />} label="NOK phone" value={patient.nextOfKinPhone} />
        </div>
      </div>

      {/* Encounters + active encounter detail */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hairline border bg-card p-4">
          <h3 className="px-2 text-lg font-semibold tracking-tight">{encounters.length} visit(s)</h3>
          <ScrollArea className="mt-3 h-[480px] pr-2">
            <div className="space-y-1.5">
              {encounters.map((e) => {
                const dept = DEPARTMENTS.find((d) => d.code === e.department);
                const reqCount = store.requests.filter((r) => r.encounterId === e.id).length;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEncId(e.id)}
                    className={cn(
                      "block w-full rounded-none border p-3 text-left transition-all",
                      selectedEncId === e.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">{e.id}</span>
                      <Pill tone={e.status === "open" ? "emerald" : "neutral"}>{e.status}</Pill>
                    </div>
                    <p className="mt-1 text-xs font-medium capitalize">{dept?.name || e.department}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {e.chiefComplaint && <p className="mt-1 text-[11px] text-foreground/80 line-clamp-1">{e.chiefComplaint}</p>}
                    {reqCount > 0 && <p className="mt-1 text-[10px] text-muted-foreground">{reqCount} request(s)</p>}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Encounter detail */}
        <div className="hairline border bg-card p-6">
          {selectedEnc ? (
            <>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {DEPARTMENTS.find((d) => d.code === selectedEnc.department)?.name} · <span className="capitalize">{selectedEnc.type}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedEnc.date).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
                    {selectedEnc.doctorId && ` · Dr. ${store.staff.find((s) => s.id === selectedEnc.doctorId)?.name.split(" ").slice(-1)[0] || ""}`}
                  </p>
                </div>
                <Pill tone={selectedEnc.status === "open" ? "emerald" : "neutral"}>{selectedEnc.status}</Pill>
              </div>

              {selectedEnc.chiefComplaint && (
                <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chief complaint</p>
                  <p className="mt-1 text-sm">{selectedEnc.chiefComplaint}</p>
                </div>
              )}

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="consultation" className="text-xs">Consultation</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">Orders ({encRequests.length})</TabsTrigger>
                  <TabsTrigger value="billing" className="text-xs">Billing ({encInvoices.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-3">
                    <DataRow label="Diagnosis" value={selectedEnc.diagnosis || "—"} />
                    <DataRow label="Notes" value={selectedEnc.notes || "No clinical notes recorded."} />
                    <DataRow label="Status" value={selectedEnc.status} />
                  </div>
                </TabsContent>

                <TabsContent value="consultation" className="mt-4">
                  <ConsultationForm encounter={selectedEnc} />
                </TabsContent>

                <TabsContent value="orders" className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Investigation orders dispatched to admin/billing</p>
                    <OrderInvestigationDialog encounterId={selectedEnc.id} patientId={selectedEnc.patientId} />
                  </div>
                  <div className="space-y-2">
                    {encRequests.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <FlaskConical className="mx-auto size-6 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No investigation orders for this encounter.</p>
                      </div>
                    )}
                    {encRequests.map((r) => (
                      <RequestCard key={r.id} req={r} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="mt-4">
                  <div className="space-y-2">
                    {encInvoices.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">No invoices for this encounter.</p>
                      </div>
                    )}
                    {encInvoices.map((inv) => (
                      <div key={inv.id} className="hairline border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{inv.id}</p>
                            <p className="text-[11px] text-slate tabular mt-0.5">
                              {new Date(inv.date).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-sm font-medium mt-1">{formatNaira(inv.total)}</p>
                          </div>
                          <Pill tone={inv.status === "paid" ? "teal" : inv.status === "hmo_pending" ? "crimson" : "crimson"}>
                            {inv.status.replace("_", " ")}
                          </Pill>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="text-muted-foreground">Patient share</p>
                            <p className="font-medium tabular">{formatNaira(inv.patientShare)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">HMO share</p>
                            <p className="font-medium tabular">{formatNaira(inv.hmoShare)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Collected</p>
                            <p className="font-medium tabular">{formatNaira(inv.amountPaid)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
              Select an encounter to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-border/60 py-2 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{value}</span>
    </div>
  );
}

function ConsultationForm({ encounter }: { encounter: Encounter }) {
  const store = useDHOIP();
  const [diagnosis, setDiagnosis] = useState(encounter.diagnosis || "");
  const [notes, setNotes] = useState(encounter.notes || "");
  const [prescription, setPrescription] = useState("");

  const save = () => {
    store.updateEncounter(encounter.id, { diagnosis, notes });
    store.logAction({
      actor: "EMP-001",
      action: "Consultation updated",
      entity: "Encounter",
      entityId: encounter.id,
      details: `Diagnosis: ${diagnosis || "—"} · Prescription: ${prescription || "—"}`,
    });
    toast.success("Consultation saved to patient folder.");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Diagnosis</Label>
        <Input
          className="mt-1"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Essential hypertension — stage 1"
        />
      </div>
      <div>
        <Label className="text-xs font-medium">Clinical notes (symptoms, examination, vitals)</Label>
        <Textarea
          className="mt-1 min-h-24"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="BP 148/92, HR 82, no oedema. Patient reports occasional morning headaches…"
        />
      </div>
      <div>
        <Label className="text-xs font-medium">Prescription (Rx)</Label>
        <Textarea
          className="mt-1 min-h-16"
          value={prescription}
          onChange={(e) => setPrescription(e.target.value)}
          placeholder="Tab Lisinopril 10mg OD × 30 days&#10;Tab Hydrochlorothiazide 12.5mg OD × 30 days"
        />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">Saved to master folder — visible to authorized clinicians.</p>
        <Button size="sm" onClick={save}>Save consultation</Button>
      </div>
    </div>
  );
}

function OrderInvestigationDialog({ encounterId, patientId }: { encounterId: string; patientId: string }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [clinicalNote, setClinicalNote] = useState("");

  const toggle = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    if (selectedServices.length === 0) {
      toast.error("Select at least one investigation.");
      return;
    }
    selectedServices.forEach((sid) => {
      store.createRequest({
        encounterId,
        patientId,
        serviceId: sid,
        requestedBy: "EMP-001",
        priority,
        clinicalNote,
      });
    });
    toast.success(`${selectedServices.length} investigation order(s) sent to Admin/Billing.`);
    setOpen(false);
    setSelectedServices([]);
    setClinicalNote("");
  };

  const grouped = DEPARTMENTS.map((d) => ({
    dept: d,
    services: store.services.filter((s) => s.department === d.code && ["clinicals", "laboratory", "radiology"].includes(d.code)),
  })).filter((g) => g.services.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-4" /> Order investigation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Order investigation · sent to Admin/Billing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as "routine" | "urgent" | "stat")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Clinical note">
              <Input value={clinicalNote} onChange={(e) => setClinicalNote(e.target.value)} placeholder="Reason for investigation" />
            </Field>
          </div>
          <div className="rounded-lg border border-border p-3 text-xs bg-amber-50/40 border-amber-200">
            <p className="font-medium text-amber-800">Workflow reminder</p>
            <p className="mt-0.5 text-amber-700">A doctor's clinical request is recorded immediately but does NOT auto-become an authorized departmental job. The request goes to Admin/Billing for invoicing, payment/HMO verification, and dispatch.</p>
          </div>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto scroll-area-edit pr-1">
            {grouped.map((g) => (
              <div key={g.dept.code}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.dept.name}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {g.services.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-all",
                        selectedServices.includes(s.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(s.id)}
                        onChange={() => toggle(s.id)}
                        className="size-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatNaira(s.price)} · {s.category}</p>
                      </div>
                      {s.requiresAuth && <Pill tone="crimson">pre-auth</Pill>}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">{selectedServices.length} service(s) selected</p>
            <Button onClick={submit}>Send to Admin/Billing</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestCard({ req }: { req: ServiceRequest }) {
  const store = useDHOIP();
  const inv = store.invoices.find((i) => i.id === req.invoiceId);
  return (
    <div className="rounded-none border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">{req.id}</span>
            <span className="text-[11px] text-slate tabular">
              {new Date(req.requestedAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            <StatusBadge status={req.status} />
          </div>
          <p className="mt-1 text-sm font-medium">{req.serviceName}</p>
          {req.clinicalNote && <p className="mt-0.5 text-[11px] text-muted-foreground italic">{req.clinicalNote}</p>}
          {req.result && (
            <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/50 p-2 text-xs">
              <p className="font-semibold text-emerald-800">Result</p>
              <p className="mt-0.5 text-emerald-900">{req.result}</p>
            </div>
          )}
          {inv && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Invoice {inv.id} · {formatNaira(inv.total)} · {inv.status.replace("_", " ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsultationDialog({ patientId, onCreated }: { patientId: string; onCreated: (encId: string) => void }) {
  const store = useDHOIP();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"outpatient" | "follow-up" | "emergency" | "inpatient">("outpatient");
  const [complaint, setComplaint] = useState("");

  const start = () => {
    const enc = store.openEncounter({
      patientId,
      date: new Date().toISOString(),
      department: "consultation",
      type,
      doctorId: "EMP-001",
      chiefComplaint: complaint,
    });
    toast.success(`New ${type} encounter opened: ${enc.id}`);
    setOpen(false);
    setComplaint("");
    onCreated(enc.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Stethoscope className="size-4" /> New consultation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open new encounter</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Encounter type">
            <Select value={type} onValueChange={(v) => setType(v as "outpatient" | "follow-up" | "emergency" | "inpatient")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outpatient">Outpatient</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="inpatient">Inpatient</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Chief complaint">
            <Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Patient reports…" className="min-h-20" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={start}>Open encounter</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyConsultations({ onSelect }: { onSelect: (pid: string) => void }) {
  const store = useDHOIP();
  const myEncounters = store.encounters.filter((e) => e.doctorId === "EMP-001");

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="My consultations"
        description="Encounters assigned to Dr. Eddy-okoye Kosiso. Open any to record diagnosis, prescription, or order investigations."
      />
      <div className="grid gap-3">
        {myEncounters.map((e) => {
          const p = store.patients.find((x) => x.id === e.patientId);
          if (!p) return null;
          return (
            <button
              key={e.id}
              onClick={() => onSelect(p.id)}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-none border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm"
            >
              <PatientAvatar patient={p} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.firstName} {p.lastName}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{e.id}</span>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{e.type} · {new Date(e.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
                {e.chiefComplaint && <p className="mt-1 text-xs italic text-foreground/80">{e.chiefComplaint}</p>}
              </div>
              <Pill tone={e.status === "open" ? "emerald" : "neutral"}>{e.status}</Pill>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultsReview() {
  const store = useDHOIP();
  const completed = store.requests.filter((r) => r.status === "completed" && r.result);

  return (
    <div className="space-y-6 fade-up">
      <SectionHeader
        title="Investigation results for review"
        description="Results completed by laboratory, radiology, or other departments. Each result is automatically attached to the patient's master folder."
      />
      <div className="grid gap-3">
        {completed.map((r) => {
          const p = store.patients.find((x) => x.id === r.patientId);
          return (
            <div key={r.id} className="hairline border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
                    <StatusBadge status={r.status} />
                    <Pill tone="slate">{r.department}</Pill>
                  </div>
                  <p className="mt-1.5 font-medium">{p ? `${p.firstName} ${p.lastName}` : "—"} · <span className="font-mono text-xs text-muted-foreground">{p?.id}</span></p>
                  <p className="text-sm text-foreground/80">{r.serviceName}</p>
                  {r.clinicalNote && <p className="mt-1 text-[11px] text-muted-foreground italic">Order note: {r.clinicalNote}</p>}
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="size-3" /> Result · {r.completedAt && new Date(r.completedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="mt-1 text-sm text-emerald-900">{r.result}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {completed.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No results ready for review.
          </div>
        )}
      </div>
    </div>
  );
}
