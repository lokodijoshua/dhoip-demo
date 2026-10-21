"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Patient,
  Encounter,
  Service,
  ServiceRequest,
  Invoice,
  Staff,
  HMO,
  Referral,
  AttendanceRecord,
  Alert,
  AuditLog,
  Role,
  RequestStatus,
  PaymentMethod,
  InvoiceLine,
  Receipt,
  ReceiptLine,
} from "./types";
import {
  seedStaff,
  seedHMOs,
  seedPatients,
  seedServices,
  seedEncounters,
  seedRequests,
  seedInvoices,
  seedReferrals,
  seedAttendance,
  seedAlerts,
  seedAudit,
  seedReceipts,
} from "./seed-data";

type DHOIPState = {
  // Active role session
  activeRole: Role | null;
  activeStaffId: string | null;
  sessionStartedAt: string | null;

  // Master records
  patients: Patient[];
  encounters: Encounter[];
  services: Service[];
  requests: ServiceRequest[];
  invoices: Invoice[];
  staff: Staff[];
  hmos: HMO[];
  referrals: Referral[];
  attendance: AttendanceRecord[];
  alerts: Alert[];
  audit: AuditLog[];
  receipts: Receipt[];

  // ID counters
  counters: {
    patient: number;
    encounter: number;
    request: number;
    invoice: number;
    referral: number;
    receipt: number;
  };

  // Actions — role session
  setRole: (role: Role) => void;
  login: (role: Role, password: string) => { ok: boolean; error?: string };
  exitRole: () => void;
  resetDemo: () => void;

  // Actions — patients
  registerPatient: (input: Omit<Patient, "id" | "registeredAt" | "registeredBy" | "alerts">) => Patient;
  getPatient: (id: string) => Patient | undefined;
  updatePatient: (id: string, patch: Partial<Patient>) => void;

  // Actions — encounters
  openEncounter: (input: Omit<Encounter, "id" | "status">) => Encounter;
  getPatientEncounters: (patientId: string) => Encounter[];
  updateEncounter: (id: string, patch: Partial<Encounter>) => void;

  // Actions — requests
  createRequest: (input: { encounterId: string; patientId: string; serviceId: string; requestedBy: string; priority: "routine" | "urgent" | "stat"; clinicalNote?: string }) => ServiceRequest;
  updateRequestStatus: (id: string, status: RequestStatus, patch?: Partial<ServiceRequest>) => void;
  assignRequest: (id: string, staffId: string) => void;

  // Actions — invoices & payments
  createInvoice: (input: { patientId: string; encounterId: string; lines: InvoiceLine[]; relatedRequests: string[]; hmoId?: string }) => Invoice;
  recordPayment: (invoiceId: string, input: { method: PaymentMethod; ref: string; cashierId: string; amountPaid?: number }) => void;
  verifyHMOAuth: (invoiceId: string, amount: number) => void;

  // Actions — receipts
  // generateReceipt combines one or more PAID invoices for the same patient
  // (typically created on the same date) into a single receipt. The receipt
  // describes the reason for payment using service names, not invoice IDs.
  generateReceipt: (input: {
    patientId: string;
    invoiceIds: string[];
    cashierId: string;
    notes?: string;
  }) => { ok: boolean; receipt?: Receipt; error?: string };
  voidReceipt: (receiptId: string, reason: string) => void;
  getPatientReceipts: (patientId: string) => Receipt[];

  // Actions — alerts & audit
  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "acknowledged">) => void;
  acknowledgeAlert: (id: string) => void;
  logAction: (input: Omit<AuditLog, "id" | "timestamp">) => void;

  // Selectors
  getDashboardStats: () => DashboardStats;
};

export type DashboardStats = {
  patientsToday: number;
  collectionsToday: number;
  pendingRequests: number;
  outstandingClaims: number;
  hmoAuthorizedToday: number;
  encountersToday: number;
  staffOnDuty: number;
  requestsByDept: Record<string, { pending: number; inProgress: number; completed: number }>;
  revenueByDept: Record<string, number>;
};

function formatNaira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export { formatNaira };

const initialState = {
  activeRole: null as Role | null,
  activeStaffId: null as string | null,
  sessionStartedAt: null as string | null,
  patients: seedPatients,
  encounters: seedEncounters,
  services: seedServices,
  requests: seedRequests,
  invoices: seedInvoices,
  staff: seedStaff,
  hmos: seedHMOs,
  referrals: seedReferrals,
  attendance: seedAttendance,
  alerts: seedAlerts,
  audit: seedAudit,
  receipts: seedReceipts,
  counters: {
    patient: 1,
    encounter: 1,
    request: 1,
    invoice: 1,
    referral: 1,
    receipt: 1,
  },
};

export const useDHOIP = create<DHOIPState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRole: (role) => {
        const staffMap: Record<Role, string> = {
          director: "EMP-005",
          doctor: "EMP-001",
          admin: "EMP-003",
        };
        set({ activeRole: role, activeStaffId: staffMap[role], sessionStartedAt: new Date().toISOString() });
        get().logAction({
          actor: `${role.toUpperCase()} session started`,
          action: "Session opened",
          entity: "Session",
          entityId: role,
          details: `Role: ${role}`,
        });
      },

      login: (role, password) => {
        // Demo-only credential check — all roles use password "123"
        if (password !== "123") {
          return { ok: false, error: "Incorrect password. Hint: use 123 for the demo." };
        }
        get().setRole(role);
        return { ok: true };
      },

      exitRole: () => set({ activeRole: null, activeStaffId: null, sessionStartedAt: null }),

      resetDemo: () => {
        set({ ...initialState, activeRole: null, activeStaffId: null, sessionStartedAt: null });
      },

      registerPatient: (input) => {
        const n = get().counters.patient;
        const patientId = `D2C-${String(n).padStart(6, "0")}`;
        const patient: Patient = {
          ...input,
          id: patientId,
          registeredAt: new Date().toISOString(),
          registeredBy: get().activeStaffId || "EMP-003",
          alerts: [],
        };
        set((s) => ({
          patients: [...s.patients, patient],
          counters: { ...s.counters, patient: n + 1 },
        }));
        get().logAction({
          actor: get().activeStaffId || "EMP-003",
          action: "Patient registered",
          entity: "Patient",
          entityId: patientId,
          details: `${patient.firstName} ${patient.lastName} — ${patient.gender}, ${patient.phone}`,
        });
        return patient;
      },

      getPatient: (id) => get().patients.find((p) => p.id === id),

      updatePatient: (id, patch) =>
        set((s) => ({ patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      openEncounter: (input) => {
        const n = get().counters.encounter;
        const id = `ENC-2026-${String(n).padStart(4, "0")}`;
        const enc: Encounter = { ...input, id, status: "open" };
        set((s) => ({
          encounters: [...s.encounters, enc],
          counters: { ...s.counters, encounter: n + 1 },
        }));
        get().logAction({
          actor: get().activeStaffId || "SYSTEM",
          action: "Encounter opened",
          entity: "Encounter",
          entityId: id,
          details: `${input.department} · ${input.type}`,
        });
        return enc;
      },

      getPatientEncounters: (patientId) =>
        get()
          .encounters.filter((e) => e.patientId === patientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

      updateEncounter: (id, patch) =>
        set((s) => ({ encounters: s.encounters.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      createRequest: (input) => {
        const n = get().counters.request;
        const id = `REQ-${String(n).padStart(3, "0")}`;
        const svc = get().services.find((s) => s.id === input.serviceId)!;
        const req: ServiceRequest = {
          id,
          encounterId: input.encounterId,
          patientId: input.patientId,
          serviceId: input.serviceId,
          serviceName: svc.name,
          department: svc.department,
          requestedBy: input.requestedBy,
          requestedAt: new Date().toISOString(),
          status: "pending_billing",
          priority: input.priority,
          clinicalNote: input.clinicalNote,
          paymentStatus: "unbilled",
        };
        set((s) => ({
          requests: [...s.requests, req],
          counters: { ...s.counters, request: n + 1 },
        }));
        get().logAction({
          actor: input.requestedBy,
          action: "Investigation ordered",
          entity: "ServiceRequest",
          entityId: id,
          details: `${svc.name} · ${svc.department}`,
        });
        get().addAlert({
          severity: "info",
          category: "operations",
          message: `New request ${id} — ${svc.name} pending billing (${svc.department})`,
        });
        return req;
      },

      updateRequestStatus: (id, status, patch) => {
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch, status } : r)),
        }));
        const req = get().requests.find((r) => r.id === id);
        get().logAction({
          actor: get().activeStaffId || "SYSTEM",
          action: `Request status → ${status}`,
          entity: "ServiceRequest",
          entityId: id,
          details: req ? req.serviceName : "",
        });
      },

      assignRequest: (id, staffId) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, assignedTo: staffId } : r)),
        })),

      createInvoice: (input) => {
        const n = get().counters.invoice;
        const id = `INV-2026-${String(n).padStart(4, "0")}`;
        const subtotal = input.lines.reduce((sum, l) => sum + l.total, 0);
        let patientShare = subtotal;
        let hmoShare = 0;
        let hmoAuthorized = 0;
        if (input.hmoId) {
          const hmo = get().hmos.find((h) => h.id === input.hmoId);
          if (hmo) {
            hmoShare = Math.round(subtotal * (hmo.coveragePercent / 100));
            patientShare = subtotal - hmoShare;
            if (!hmo.requiresPreAuth) hmoAuthorized = hmoShare;
          }
        }
        const inv: Invoice = {
          id,
          patientId: input.patientId,
          encounterId: input.encounterId,
          date: new Date().toISOString(),
          lines: input.lines,
          subtotal,
          discount: 0,
          total: subtotal,
          patientShare,
          hmoShare,
          amountPaid: 0,
          hmoAuthorized,
          hmoReceived: 0,
          outstanding: patientShare,
          status: input.hmoId && hmoShare > 0 && hmoAuthorized === 0 ? "hmo_pending" : "unpaid",
          hmoId: input.hmoId,
          relatedRequests: input.relatedRequests,
        };
        set((s) => ({
          invoices: [...s.invoices, inv],
          counters: { ...s.counters, invoice: n + 1 },
          requests: s.requests.map((r) =>
            input.relatedRequests.includes(r.id)
              ? { ...r, invoiceId: id, status: "pending_payment", paymentStatus: inv.status === "hmo_pending" ? "hmo_pending" : "billed" }
              : r
          ),
        }));
        get().logAction({
          actor: get().activeStaffId || "EMP-003",
          action: "Invoice created",
          entity: "Invoice",
          entityId: id,
          details: `${input.lines.length} line(s) · ${formatNaira(subtotal)}`,
        });
        return inv;
      },

      recordPayment: (invoiceId, input) => {
        const inv = get().invoices.find((i) => i.id === invoiceId);
        if (!inv) return;
        const amountPaid = input.amountPaid ?? inv.patientShare;
        const newOutstanding = Math.max(0, inv.patientShare - amountPaid);
        const status = newOutstanding === 0 ? "paid" : "partial";
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  amountPaid,
                  outstanding: newOutstanding,
                  paymentMethod: input.method,
                  paymentRef: input.ref,
                  paidAt: new Date().toISOString(),
                  cashierId: input.cashierId,
                  status,
                }
              : i
          ),
          requests: s.requests.map((r) => {
            if (!inv.relatedRequests.includes(r.id)) return r;
            // If HMO share is pre-authorized OR no HMO share → mark authorized & release to department
            const isHmoClear = i_hmoClear(get, inv);
            if (status === "paid" && isHmoClear) {
              return {
                ...r,
                paymentStatus: "paid" as const,
                status: "authorized" as const,
                releasedAt: new Date().toISOString(),
              };
            }
            if (status === "paid") {
              return { ...r, paymentStatus: "paid" as const };
            }
            return r;
          }),
        }));
        get().logAction({
          actor: input.cashierId,
          action: "Payment recorded",
          entity: "Invoice",
          entityId: invoiceId,
          details: `${input.method.toUpperCase()} ${formatNaira(amountPaid)} · ref ${input.ref}`,
        });
        // Auto-release authorized requests
        const updated = get().invoices.find((i) => i.id === invoiceId)!;
        if (updated.status === "paid") {
          const reqs = get().requests.filter((r) => inv.relatedRequests.includes(r.id) && r.status === "authorized");
          reqs.forEach((r) => {
            get().updateRequestStatus(r.id, "dispatched", { releasedAt: new Date().toISOString() });
          });
        }
      },

      verifyHMOAuth: (invoiceId, amount) => {
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  hmoAuthorized: amount,
                  status: i.patientShare === i.amountPaid ? "paid" : "partial",
                  outstanding: i.patientShare - i.amountPaid,
                }
              : i
          ),
          requests: s.requests.map((r) => {
            const inv = s.invoices.find((i) => i.id === invoiceId);
            if (!inv || !inv.relatedRequests.includes(r.id)) return r;
            const isPatientPaid = inv.patientShare === inv.amountPaid || inv.patientShare === 0;
            if (isPatientPaid) {
              return {
                ...r,
                paymentStatus: "hmo_authorized" as const,
                status: "authorized" as const,
                releasedAt: new Date().toISOString(),
              };
            }
            return { ...r, paymentStatus: "hmo_authorized" as const };
          }),
        }));
        get().logAction({
          actor: get().activeStaffId || "EMP-009",
          action: "HMO authorization verified",
          entity: "Invoice",
          entityId: invoiceId,
          details: `Authorized ${formatNaira(amount)}`,
        });
      },

      generateReceipt: ({ patientId, invoiceIds, cashierId, notes }) => {
        const state = get();
        const patient = state.patients.find((p) => p.id === patientId);
        if (!patient) {
          return { ok: false, error: "Patient not found." };
        }
        if (!invoiceIds.length) {
          return { ok: false, error: "Select at least one invoice to combine." };
        }

        // Load all source invoices and validate they belong to this patient
        const sourceInvoices: Invoice[] = [];
        for (const invId of invoiceIds) {
          const inv = state.invoices.find((i) => i.id === invId);
          if (!inv) {
            return { ok: false, error: `Invoice ${invId} not found.` };
          }
          if (inv.patientId !== patientId) {
            return {
              ok: false,
              error: `Invoice ${invId} belongs to a different patient. All selected invoices must be for the same patient.`,
            };
          }
          if (inv.status === "void") {
            return { ok: false, error: `Invoice ${invId} is voided and cannot be receipted.` };
          }
          sourceInvoices.push(inv);
        }

        const cashier = state.staff.find((s) => s.id === cashierId);
        const hmo = sourceInvoices.find((i) => i.hmoId)?.hmoId
          ? state.hmos.find((h) => h.id === sourceInvoices.find((i) => i.hmoId)!.hmoId)
          : undefined;

        // Aggregate invoice lines by service name.
        // This is the key transformation: we group identical service names across
        // multiple invoices into a single receipt line, so the patient sees
        // "Chest X-ray × 2" instead of two separate invoice line entries.
        const lineMap = new Map<string, { quantity: number; unitPrice: number; amount: number }>();
        for (const inv of sourceInvoices) {
          for (const line of inv.lines) {
            const existing = lineMap.get(line.serviceName);
            if (existing) {
              existing.quantity += line.quantity;
              existing.amount += line.total;
              // Keep the unit price from the first occurrence (they should be identical
              // for the same service, but if there's a discrepancy we use the latest unit price
              // for display purposes only — the amount field is the source of truth).
              existing.unitPrice = line.unitPrice;
            } else {
              lineMap.set(line.serviceName, {
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                amount: line.total,
              });
            }
          }
        }
        const receiptLines: ReceiptLine[] = Array.from(lineMap.entries()).map(([serviceName, v]) => ({
          serviceName,
          quantity: v.quantity,
          unitPrice: v.unitPrice,
          amount: v.amount,
        }));

        const totalAmount = sourceInvoices.reduce((s, i) => s + i.total, 0);
        const amountPaid = sourceInvoices.reduce((s, i) => s + i.amountPaid, 0);
        const hmoAuthorized = sourceInvoices.reduce((s, i) => s + i.hmoAuthorized, 0);

        // Determine the invoice date — the date the source invoices were created.
        // If they span multiple dates, use the earliest one (typical case: same day).
        const invoiceDates = sourceInvoices.map((i) => i.date.split("T")[0]).sort();
        const invoiceDate = invoiceDates[0];

        // Payment method + reference: use the most common method, and join all refs.
        const methodCounts = new Map<PaymentMethod, number>();
        for (const inv of sourceInvoices) {
          if (inv.paymentMethod) {
            methodCounts.set(inv.paymentMethod, (methodCounts.get(inv.paymentMethod) || 0) + 1);
          }
        }
        let primaryMethod: PaymentMethod = "cash";
        let maxCount = 0;
        for (const [m, c] of methodCounts.entries()) {
          if (c > maxCount) {
            maxCount = c;
            primaryMethod = m;
          }
        }
        const paymentRefs = sourceInvoices
          .map((i) => i.paymentRef)
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
          .join(", ");

        // Generate the receipt ID
        const n = state.counters.receipt;
        const receiptId = `RCT-2026-${String(n).padStart(4, "0")}`;

        const receipt: Receipt = {
          id: receiptId,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          issueDate: new Date().toISOString(),
          invoiceDate,
          invoiceIds: sourceInvoices.map((i) => i.id),
          lines: receiptLines,
          totalAmount,
          amountPaid,
          hmoAuthorized,
          paymentMethod: primaryMethod,
          paymentRef: paymentRefs || "—",
          cashierId,
          cashierName: cashier?.name || cashierId,
          hmoName: hmo?.name,
          status: "issued",
          notes,
        };

        set((s) => ({
          receipts: [receipt, ...s.receipts],
          counters: { ...s.counters, receipt: n + 1 },
        }));

        get().logAction({
          actor: cashierId,
          action: "Receipt issued",
          entity: "Receipt",
          entityId: receiptId,
          details: `${receipt.patientName} · ${sourceInvoices.length} invoice(s) · ${formatNaira(amountPaid)} paid`,
        });

        return { ok: true, receipt };
      },

      voidReceipt: (receiptId, reason) => {
        const receipt = get().receipts.find((r) => r.id === receiptId);
        if (!receipt) return;
        set((s) => ({
          receipts: s.receipts.map((r) =>
            r.id === receiptId
              ? {
                  ...r,
                  status: "void",
                  voidedAt: new Date().toISOString(),
                  voidedBy: get().activeStaffId || undefined,
                  voidReason: reason,
                }
              : r
          ),
        }));
        get().logAction({
          actor: get().activeStaffId || "EMP-003",
          action: "Receipt voided",
          entity: "Receipt",
          entityId: receiptId,
          details: reason,
        });
      },

      getPatientReceipts: (patientId) =>
        get()
          .receipts.filter((r) => r.patientId === patientId)
          .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()),

      addAlert: (alert) =>
        set((s) => ({
          alerts: [
            {
              ...alert,
              id: `ALT-${String(s.alerts.length + 1).padStart(3, "0")}`,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            },
            ...s.alerts,
          ],
        })),

      acknowledgeAlert: (id) =>
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })),

      logAction: (input) =>
        set((s) => ({
          audit: [
            {
              ...input,
              id: `LOG-${String(s.audit.length + 1).padStart(3, "0")}`,
              timestamp: new Date().toISOString(),
            },
            ...s.audit,
          ],
        })),

      getDashboardStats: () => {
        // For the demo, "today" is anchored to the seed data date (21 Oct 2026).
        // In production, this would use new Date().toISOString().split("T")[0].
        const today = "2026-10-21";
        const state = get();
        const todayEncounters = state.encounters.filter((e) => e.date.startsWith(today));
        const todayInvoices = state.invoices.filter((i) => i.date.startsWith(today));
        const collectionsToday = todayInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
        const pendingRequests = state.requests.filter((r) =>
          ["pending_billing", "pending_payment", "authorized"].includes(r.status)
        ).length;
        const outstandingClaims = state.hmos.reduce((sum, h) => sum + h.outstanding, 0);
        const hmoAuthorizedToday = todayInvoices.reduce((sum, i) => sum + i.hmoAuthorized, 0);
        const staffOnDuty = state.staff.filter((s) => s.onDuty).length;
        const requestsByDept: Record<string, { pending: number; inProgress: number; completed: number }> = {};
        const revenueByDept: Record<string, number> = {};
        for (const r of state.requests) {
          const d = r.department;
          if (!requestsByDept[d]) requestsByDept[d] = { pending: 0, inProgress: 0, completed: 0 };
          if (["pending_billing", "pending_payment", "authorized"].includes(r.status)) requestsByDept[d].pending++;
          else if (["dispatched", "in_progress"].includes(r.status)) requestsByDept[d].inProgress++;
          else if (r.status === "completed") requestsByDept[d].completed++;
        }
        for (const i of state.invoices) {
          for (const reqId of i.relatedRequests) {
            const r = state.requests.find((x) => x.id === reqId);
            if (r) {
              revenueByDept[r.department] = (revenueByDept[r.department] || 0) + i.amountPaid + i.hmoAuthorized;
            }
          }
        }
        return {
          patientsToday: new Set(todayEncounters.map((e) => e.patientId)).size,
          collectionsToday,
          pendingRequests,
          outstandingClaims,
          hmoAuthorizedToday,
          encountersToday: todayEncounters.length,
          staffOnDuty,
          requestsByDept,
          revenueByDept,
        };
      },
    }),
    {
      name: "dhoip-demo-session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        activeRole: s.activeRole,
        activeStaffId: s.activeStaffId,
        sessionStartedAt: s.sessionStartedAt,
        patients: s.patients,
        encounters: s.encounters,
        services: s.services,
        requests: s.requests,
        invoices: s.invoices,
        staff: s.staff,
        hmos: s.hmos,
        referrals: s.referrals,
        attendance: s.attendance,
        alerts: s.alerts,
        audit: s.audit,
        receipts: s.receipts,
        counters: s.counters,
      }),
    }
  )
);

// helper for HMO clearance check
function i_hmoClear(get: () => DHOIPState, inv: Invoice): boolean {
  if (!inv.hmoId) return true;
  if (inv.hmoShare === 0) return true;
  return inv.hmoAuthorized >= inv.hmoShare;
}

// ============ Hydration helpers (Next.js SSR safe) ============

import { useEffect, useState } from "react";

/**
 * Hook that returns true once the persisted store has been rehydrated on the client.
 * Standard pattern for gating store-dependent UI during SSR/first paint.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      // manually rehydrate the persisted store on mount
      try {
        useDHOIP.persist?.rehydrate();
      } catch (e) {
        console.warn("Rehydrate failed:", e);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true);
    }
  }, []);
  return hydrated;
}
