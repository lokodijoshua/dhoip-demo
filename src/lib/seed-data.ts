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
  Receipt,
} from "./types";

// ============================================================================
// SEED DATA — D-HOIP demo
// Per user request, all transactional seed data (patients, encounters,
// requests, invoices, receipts, referrals, alerts, audit) is EMPTY. The user
// will create their own data through the UI. Reference data that the system
// needs to operate (staff, HMOs, services catalogue, departments) is kept.
// ============================================================================

// ============ Staff ============
// Per user request: only 3 staff with the user-provided names. Each one maps
// to one of the 3 role-based workspaces (Director / Doctor / Admin).
export const seedStaff: Staff[] = [
  {
    id: "EMP-001",
    name: "Dr. Eddy-okoye Kosiso",
    role: "doctor",
    title: "Senior Consultant Physician",
    department: "consultation",
    avatarColor: "oklch(0.55 0.07 178)",
    initials: "EK",
    active: true,
    onDuty: true,
    clockIn: "08:12",
  },
  {
    id: "EMP-003",
    name: "Joseph Sinai Bellomy",
    role: "admin",
    title: "Front Desk & Registration",
    department: "admin",
    avatarColor: "oklch(0.55 0.14 145)",
    initials: "JB",
    active: true,
    onDuty: true,
    clockIn: "07:58",
  },
  {
    id: "EMP-005",
    name: "Dir. Jonathan C. Ogidi",
    role: "director",
    title: "Medical Director",
    department: "admin",
    avatarColor: "oklch(0.36 0.05 178)",
    initials: "JO",
    active: true,
    onDuty: true,
    clockIn: "07:45",
  },
];

// ============ HMOs (reference data — needed for invoicing) ============
export const seedHMOs: HMO[] = [
  {
    id: "HMO-001",
    name: "NHIS Family Plan",
    plan: "Formal Sector",
    memberName: "—",
    memberId: "—",
    coveragePercent: 90,
    requiresPreAuth: true,
    outstanding: 0,
  },
  {
    id: "HMO-002",
    name: "Reliance HMO",
    plan: "Ruby Individual",
    memberName: "—",
    memberId: "—",
    coveragePercent: 80,
    requiresPreAuth: true,
    outstanding: 0,
  },
  {
    id: "HMO-003",
    name: "AXA Mansard Health",
    plan: "Sapphire Corporate",
    memberName: "—",
    memberId: "—",
    coveragePercent: 100,
    requiresPreAuth: true,
    outstanding: 0,
  },
  {
    id: "HMO-004",
    name: "Hygeia HMO",
    plan: "Gold Family",
    memberName: "—",
    memberId: "—",
    coveragePercent: 75,
    requiresPreAuth: false,
    outstanding: 0,
  },
];

// ============ Patients (empty — user creates their own) ============
export const seedPatients: Patient[] = [];

// ============ Services catalogue (reference data — needed for ordering) ============
export const seedServices: Service[] = [
  // Consultation
  { id: "SVC-CON-001", code: "CONS-GEN", name: "General Consultation", department: "consultation", price: 5000, category: "Consultation", requiresAuth: false, duration: "20 min" },
  { id: "SVC-CON-002", code: "CONS-SPC", name: "Specialist Consultation", department: "consultation", price: 12000, category: "Consultation", requiresAuth: true, duration: "30 min" },
  { id: "SVC-CON-003", code: "CONS-FUP", name: "Follow-up Consultation", department: "consultation", price: 3000, category: "Consultation", requiresAuth: false, duration: "15 min" },
  // Clinicals
  { id: "SVC-CLN-001", code: "CLN-REVIEW", name: "Clinical Review", department: "clinicals", price: 10000, category: "Clinical", requiresAuth: false, duration: "25 min" },
  { id: "SVC-CLN-002", code: "CLN-INV", name: "Clinical Investigation", department: "clinicals", price: 14000, category: "Clinical", requiresAuth: true, duration: "30 min" },
  { id: "SVC-CLN-003", code: "CLN-SPC", name: "Specialist Clinical Assessment", department: "clinicals", price: 18000, category: "Clinical", requiresAuth: true, duration: "40 min" },
  // Laboratory
  { id: "SVC-LAB-001", code: "LAB-FBC", name: "Full Blood Count", department: "laboratory", price: 3500, category: "Hematology", requiresAuth: false },
  { id: "SVC-LAB-002", code: "LAB-MPS", name: "Malaria Parasite Screen", department: "laboratory", price: 2500, category: "Microbiology", requiresAuth: false },
  { id: "SVC-LAB-003", code: "LAB-LFT", name: "Liver Function Test", department: "laboratory", price: 8500, category: "Chemistry", requiresAuth: true },
  { id: "SVC-LAB-004", code: "LAB-RFT", name: "Renal Function Test", department: "laboratory", price: 7500, category: "Chemistry", requiresAuth: true },
  { id: "SVC-LAB-005", code: "LAB-LIP", name: "Lipid Profile", department: "laboratory", price: 9000, category: "Chemistry", requiresAuth: true },
  { id: "SVC-LAB-006", code: "LAB-WID", name: "Widal Test (Typhoid)", department: "laboratory", price: 3000, category: "Serology", requiresAuth: false },
  { id: "SVC-LAB-007", code: "LAB-PREG", name: "Pregnancy Test (hCG)", department: "laboratory", price: 2000, category: "Chemistry", requiresAuth: false },
  // Radiology
  { id: "SVC-RAD-001", code: "RAD-US-ABD", name: "Ultrasound — Abdominopelvic", department: "radiology", price: 18000, category: "Ultrasound", requiresAuth: true, duration: "30 min" },
  { id: "SVC-RAD-002", code: "RAD-US-OB", name: "Ultrasound — Obstetric", department: "radiology", price: 20000, category: "Ultrasound", requiresAuth: true, duration: "30 min" },
  { id: "SVC-RAD-003", code: "RAD-XR-CH", name: "X-Ray — Chest", department: "radiology", price: 12000, category: "X-Ray", requiresAuth: true, duration: "15 min" },
  { id: "SVC-RAD-004", code: "RAD-XR-EXT", name: "X-Ray — Extremity", department: "radiology", price: 10000, category: "X-Ray", requiresAuth: true, duration: "15 min" },
  { id: "SVC-RAD-005", code: "RAD-CT-BR", name: "CT Scan — Brain", department: "radiology", price: 75000, category: "CT Scan", requiresAuth: true, duration: "45 min" },
  // Maternity
  { id: "SVC-MAT-001", code: "MAT-ANC", name: "Antenatal Visit", department: "maternity", price: 8000, category: "Antenatal", requiresAuth: false, duration: "30 min" },
  { id: "SVC-MAT-002", code: "MAT-DEL", name: "Normal Delivery", department: "maternity", price: 150000, category: "Delivery", requiresAuth: true, duration: "8-12 hr" },
  { id: "SVC-MAT-003", code: "MAT-CS", name: "Caesarean Section", department: "maternity", price: 450000, category: "Surgical", requiresAuth: true, duration: "2-3 hr" },
  // Surgery
  { id: "SVC-SUR-001", code: "SUR-CONS", name: "Surgical Consultation", department: "surgery", price: 15000, category: "Consultation", requiresAuth: true, duration: "30 min" },
  { id: "SVC-SUR-002", code: "SUR-APND", name: "Appendectomy", department: "surgery", price: 380000, category: "Procedure", requiresAuth: true, duration: "1.5 hr" },
  { id: "SVC-SUR-003", code: "SUR-HERN", name: "Hernia Repair", department: "surgery", price: 320000, category: "Procedure", requiresAuth: true, duration: "1.5 hr" },
  // Ophthalmology (formerly Eye Section)
  { id: "SVC-EYE-001", code: "EYE-EXM", name: "Eye Examination", department: "eye", price: 7000, category: "Examination", requiresAuth: false, duration: "20 min" },
  { id: "SVC-EYE-002", code: "EYE-REF", name: "Refraction Test", department: "eye", price: 5500, category: "Examination", requiresAuth: false, duration: "20 min" },
  { id: "SVC-EYE-003", code: "EYE-CT", name: "Cataract Surgery (Single Eye)", department: "eye", price: 280000, category: "Procedure", requiresAuth: true, duration: "1 hr" },
];

// ============ Encounters (empty — user creates their own) ============
export const seedEncounters: Encounter[] = [];

// ============ Service Requests (empty) ============
export const seedRequests: ServiceRequest[] = [];

// ============ Invoices (empty) ============
export const seedInvoices: Invoice[] = [];

// ============ Referrals (empty) ============
export const seedReferrals: Referral[] = [];

// ============ Attendance (today — reflects the 3 staff on duty) ============
const today = "2026-10-21";
export const seedAttendance: AttendanceRecord[] = [
  { id: "ATT-001", staffId: "EMP-005", date: today, clockIn: "07:45", location: "central_kiosk", device: "Kiosk-A", status: "on_time" },
  { id: "ATT-002", staffId: "EMP-003", date: today, clockIn: "07:58", location: "central_kiosk", device: "Kiosk-A", status: "on_time" },
  { id: "ATT-003", staffId: "EMP-001", date: today, clockIn: "08:12", location: "department", device: "WS-CONS-01", status: "on_time" },
];

// ============ Management alerts (empty) ============
export const seedAlerts: Alert[] = [];

// ============ Audit logs (empty) ============
export const seedAudit: AuditLog[] = [];

// ============ Receipts (empty) ============
export const seedReceipts: Receipt[] = [];
