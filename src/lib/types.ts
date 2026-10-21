// D-HOIP relational data model — types mirror the Prisma schema
// Patient → Encounter → ServiceRequest → Invoice → Payment
// Department → Service (catalogue) → ServiceRequest
// Staff → Role → User; Attendance; Referral; HMO

export type Role = "director" | "doctor" | "admin";

export type DepartmentCode =
  | "consultation"
  | "clinicals"
  | "laboratory"
  | "radiology"
  | "maternity"
  | "surgery"
  | "eye";

export type DepartmentInfo = {
  code: DepartmentCode;
  name: string;
  tagline: string;
};

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: "consultation", name: "Consultation", tagline: "Clinical assessment & physician orders" },
  { code: "clinicals", name: "Clinicals", tagline: "Clinical investigations & specialist review" },
  { code: "laboratory", name: "Laboratory", tagline: "Specimens, tests, results & verification" },
  { code: "radiology", name: "Radiology", tagline: "Ultrasound · X-ray · CT scan" },
  { code: "maternity", name: "Maternity", tagline: "Antenatal, delivery, postnatal & newborn" },
  { code: "surgery", name: "Surgery", tagline: "Preoperative, theatre & procedure records" },
  { code: "eye", name: "Ophthalmology", tagline: "Visual assessment & ophthalmic procedures" },
];

export type StaffRole =
  | "director"
  | "doctor"
  | "admin"
  | "cashier"
  | "lab_tech"
  | "radiographer"
  | "maternity_staff"
  | "nurse"
  | "claims_officer";

export type Staff = {
  id: string; // EMP-001
  name: string;
  role: StaffRole;
  title: string;
  department: DepartmentCode | "admin" | "finance";
  avatarColor: string;
  initials: string;
  active: boolean;
  onDuty: boolean;
  clockIn?: string;
  clockOut?: string;
};

export type Patient = {
  id: string; // D2C-000125
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: "Male" | "Female";
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  bloodGroup?: string;
  genotype?: string;
  allergies: string[];
  hmoId?: string; // HMO membership
  hmoPlan?: string;
  registeredAt: string;
  registeredBy: string;
  alerts: string[];
};

export type Encounter = {
  id: string; // ENC-2026-0001
  patientId: string;
  date: string;
  department: DepartmentCode;
  type: "outpatient" | "emergency" | "inpatient" | "follow-up";
  doctorId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  status: "open" | "closed";
  notes?: string;
};

export type Service = {
  id: string; // SVC-LAB-001
  code: string;
  name: string;
  department: DepartmentCode;
  price: number; // in Naira
  category: string;
  requiresAuth: boolean; // HMO pre-auth required
  duration?: string;
};

export type RequestStatus =
  | "draft"
  | "pending_billing"
  | "pending_payment"
  | "authorized"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ServiceRequest = {
  id: string; // REQ-001
  encounterId: string;
  patientId: string;
  serviceId: string;
  serviceName: string;
  department: DepartmentCode;
  requestedBy: string; // staff id
  requestedAt: string;
  status: RequestStatus;
  priority: "routine" | "urgent" | "stat";
  clinicalNote?: string;
  assignedTo?: string;
  paymentStatus: "unbilled" | "billed" | "paid" | "hmo_authorized" | "hmo_pending";
  invoiceId?: string;
  result?: string;
  completedAt?: string;
  releasedAt?: string;
};

export type InvoiceLine = {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PaymentMethod = "cash" | "pos" | "transfer" | "hmo";

export type Invoice = {
  id: string; // INV-2026-0001
  patientId: string;
  encounterId: string;
  date: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  // Payment split (patient vs HMO)
  patientShare: number;
  hmoShare: number;
  amountPaid: number; // paid by patient
  hmoAuthorized: number;
  hmoReceived: number;
  outstanding: number;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  paidAt?: string;
  cashierId?: string;
  status: "unpaid" | "partial" | "paid" | "hmo_pending" | "void";
  hmoId?: string;
  relatedRequests: string[];
};

export type HMO = {
  id: string;
  name: string;
  plan: string;
  memberName: string;
  memberId: string;
  coveragePercent: number;
  requiresPreAuth: boolean;
  outstanding: number;
};

// ============ Receipts ============
// A receipt is issued AFTER payment is collected. Multiple paid invoices for
// the same patient (typically on the same day) can be combined into a single
// receipt. The receipt describes the reason for payment using the *service
// names* (e.g. "Chest X-ray") rather than the invoice IDs, so the patient
// sees a clean, human-readable document.

export type ReceiptLine = {
  serviceName: string; // e.g. "Chest X-ray" — reason for payment
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
};

export type ReceiptStatus = "issued" | "void";

export type Receipt = {
  id: string; // RCT-2026-0001
  patientId: string;
  patientName: string; // snapshot at issue time
  issueDate: string; // ISO datetime when receipt was issued
  invoiceDate: string; // YYYY-MM-DD — the date the source invoices were created
  invoiceIds: string[]; // source invoices combined into this receipt
  lines: ReceiptLine[]; // aggregated by service name across all source invoices
  totalAmount: number; // sum of all line amounts (= sum of invoice totals)
  amountPaid: number; // total collected from patient across all source invoices
  hmoAuthorized: number; // total authorized from HMO across all source invoices
  paymentMethod: PaymentMethod;
  paymentRef: string; // combined payment references, comma-separated
  cashierId: string;
  cashierName: string; // snapshot
  hmoName?: string; // snapshot if patient had HMO coverage
  status: ReceiptStatus;
  notes?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
};

export type ReferralType = "internal" | "incoming" | "outgoing";

export type Referral = {
  id: string; // REF-001
  patientId: string;
  type: ReferralType;
  date: string;
  source: string; // who refers
  destination: string; // who receives
  reason: string;
  status: "pending" | "acknowledged" | "completed" | "rejected";
  commission?: number;
  commissionStatus?: "none" | "expected" | "paid" | "received";
};

export type AttendanceRecord = {
  id: string;
  staffId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  location: "central_kiosk" | "department";
  device: string;
  status: "on_time" | "late" | "absent" | "leave";
};

export type Alert = {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "billing" | "clinical" | "operations" | "inventory" | "claims";
  message: string;
  timestamp: string;
  acknowledged: boolean;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
};
