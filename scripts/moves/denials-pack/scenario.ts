/** Pure fixture model. All records are invented; this module has no I/O or load path. */
export const NOTICE = "Synthetic — not real data — AbarVa demo";
export const DATASET_ID = "meridian-denials-pack-v1";
export const PACK_FILES = [
  "01-use-case-brief.docx",
  "02-denials-baseline.xlsx",
  "03-denial-reason-taxonomy.xlsx",
  "04-source-system-inventory.xlsx",
  "05-interview-notes.md",
  "06-finance-baseline.xlsx",
  "07-current-workflow.pdf",
  "08-payer-policy-excerpts.pdf",
] as const;
export const FACILITIES = [
  { id: "F-01", name: "Demo Hospital Amber", baseClaims: 50000 },
  { id: "F-02", name: "Demo Hospital Violet", baseClaims: 35000 },
  { id: "F-03", name: "Demo Hospital Copper", baseClaims: 25000 },
  { id: "F-04", name: "Demo Physician Group Indigo", baseClaims: 40000 },
];
export const PAYERS = [
  { id: "PY-01", name: "Invented Payer Quartz", share: 0.4 },
  { id: "PY-02", name: "Invented Payer Cobalt", share: 0.3 },
  { id: "PY-03", name: "Invented Payer Ochre", share: 0.2 },
  { id: "PY-04", name: "Invented Payer Jade", share: 0.1 },
];
export const SERVICES = [
  {
    id: "SL-01",
    name: "Hospital ambulatory",
    share: 0.5,
    charge: 3200,
    allowed: 1180,
  },
  {
    id: "SL-02",
    name: "Hospital inpatient",
    share: 0.3,
    charge: 12800,
    allowed: 4480,
  },
  {
    id: "SL-03",
    name: "Professional services",
    share: 0.2,
    charge: 740,
    allowed: 290,
  },
];
export const REASONS = [
  {
    id: "D-EL",
    group: "Eligibility",
    share: 0.35,
    preventable: 0.8,
    owner: "Patient access lead",
    policy: "POL-01",
    definition: "Coverage version or subscriber match absent at submission",
  },
  {
    id: "D-AU",
    group: "Authorization",
    share: 0.3,
    preventable: 0.75,
    owner: "Authorization team lead",
    policy: "POL-02",
    definition:
      "Authorization identifier or approved service scope mismatches the claim",
  },
  {
    id: "D-CO",
    group: "Coding",
    share: 0.2,
    preventable: 0.6,
    owner: "Coding manager",
    policy: "POL-03",
    definition:
      "Procedure and administrative code combination fails the invented edit",
  },
  {
    id: "D-DO",
    group: "Documentation",
    share: 0.15,
    preventable: 0.5,
    owner: "Documentation operations lead",
    policy: "POL-04",
    definition: "Required supporting attachment or reference is missing",
  },
];
export const SOURCES = [
  {
    id: "SYS-01",
    name: "Invented EHR and billing ledger",
    owner: "Revenue cycle systems owner",
    refresh: "Daily closed-batch extract",
    access: "Read-only service identity after access review",
    issue: "Corrected claim versions share an episode identifier",
    tables: 8,
    policy: "POL-01",
  },
  {
    id: "SYS-02",
    name: "Invented clearinghouse acknowledgements",
    owner: "Revenue cycle integration lead",
    refresh: "Hourly receipt batches",
    access: "Contracted sandbox export after approval",
    issue: "Receipt timestamps omit timezone in one feed",
    tables: 4,
    policy: "POL-02",
  },
  {
    id: "SYS-03",
    name: "Invented payer remittance ledger",
    owner: "Cash application manager",
    refresh: "Daily payment-file batches",
    access: "Read-only remittance landing zone",
    issue: "Multiple reason codes need one primary causal grouping",
    tables: 6,
    policy: "POL-04",
  },
  {
    id: "SYS-04",
    name: "Invented eligibility response store",
    owner: "Patient access lead",
    refresh: "Daily versioned responses",
    access: "Purpose-bound response export",
    issue: "Coverage must be joined as of the service date",
    tables: 3,
    policy: "POL-01",
  },
  {
    id: "SYS-05",
    name: "Invented authorization tracker",
    owner: "Authorization team lead",
    refresh: "Daily change log",
    access: "Approved read-only team extract",
    issue: "Authorization end dates are missing in legacy entries",
    tables: 3,
    policy: "POL-02",
  },
  {
    id: "SYS-06",
    name: "Invented coding workqueue",
    owner: "Coding manager",
    refresh: "Daily queue and edit history",
    access: "Read-only administrative edit export",
    issue: "Override reasons are free text and need reviewed mapping",
    tables: 4,
    policy: "POL-03",
  },
];
export const QUARTERS = [
  "2024-Q3",
  "2024-Q4",
  "2025-Q1",
  "2025-Q2",
  "2025-Q3",
  "2025-Q4",
  "2026-Q1",
  "2026-Q2",
];
export const ASSUMPTIONS = {
  recoveryShare: 0.65,
  writeOffShare: 0.25,
  adjustmentShare: 0.1,
  reworkHoursPerDenial: 0.85,
  loadedAdminHourlyCost: 41,
  vendorAnnualSpend: 385000,
  annualDiscountRate: 0.09,
  currentDaysAR: 58,
  targetDaysAR: 50,
  detectionLagDays: 23,
  preventionShare: 0.18,
  attribution: 0.65,
  probability: 0.75,
  reworkReductionShare: 0.22,
  benefitStartMonth: 8,
  rampMonths: 6,
  currentPaymentLagMonths: 2,
  targetDenialRate: 0.11,
  budgetCeiling: 2200000,
};
export interface ClaimCohort {
  id: string;
  quarter: string;
  facility: string;
  payer: string;
  service: string;
  claims: number;
  grossCharges: number;
  allowedAmount: number;
}
export interface DenialCohort {
  id: string;
  cohortId: string;
  quarter: string;
  facility: string;
  payer: string;
  service: string;
  reason: string;
  denials: number;
  deniedAllowed: number;
  recoveries: number;
  writeOffs: number;
  adjustments: number;
  reworkHours: number;
  preventableDenials: number;
}
export function buildScenario() {
  const claims: ClaimCohort[] = [];
  const denials: DenialCohort[] = [];
  QUARTERS.forEach((quarter, q) =>
    FACILITIES.forEach((facility, f) =>
      PAYERS.forEach((payer, p) =>
        SERVICES.forEach((service, s) => {
          const count = Math.round(
            facility.baseClaims *
              (0.92 + q * 0.02) *
              payer.share *
              service.share,
          );
          const id = `${quarter}:${facility.id}:${payer.id}:${service.id}`;
          const totalDenials = Math.round(
            count * (0.14 + q * 0.002 + f * 0.002 + p * 0.004 + s * 0.001),
          );
          claims.push({
            id,
            quarter,
            facility: facility.id,
            payer: payer.id,
            service: service.id,
            claims: count,
            grossCharges: count * service.charge,
            allowedAmount: count * service.allowed,
          });
          let assigned = 0;
          REASONS.forEach((reason, r) => {
            const n =
              r === REASONS.length - 1
                ? totalDenials - assigned
                : Math.round(totalDenials * reason.share);
            assigned += n;
            const deniedAllowed = n * service.allowed;
            const recoveries =
              Math.round(deniedAllowed * ASSUMPTIONS.recoveryShare * 100) / 100;
            const writeOffs =
              Math.round(deniedAllowed * ASSUMPTIONS.writeOffShare * 100) / 100;
            denials.push({
              id: `${id}:${reason.id}`,
              cohortId: id,
              quarter,
              facility: facility.id,
              payer: payer.id,
              service: service.id,
              reason: reason.id,
              denials: n,
              deniedAllowed,
              recoveries,
              writeOffs,
              adjustments:
                Math.round((deniedAllowed - recoveries - writeOffs) * 100) /
                100,
              reworkHours:
                Math.round(n * ASSUMPTIONS.reworkHoursPerDenial * 100) / 100,
              preventableDenials: Math.floor(n * reason.preventable),
            });
          });
        }),
      ),
    ),
  );
  const aggregate = (periods: readonly string[]) => {
    const cs = claims.filter((c) => periods.includes(c.quarter));
    const ds = denials.filter((d) => periods.includes(d.quarter));
    const sum = <T>(rows: T[], get: (r: T) => number) =>
      Math.round(rows.reduce((a, r) => a + get(r), 0) * 100) / 100;
    const count = sum(cs, (c) => c.claims);
    const dn = sum(ds, (d) => d.denials);
    return {
      claims: count,
      denials: dn,
      denialRate: dn / count,
      grossCharges: sum(cs, (c) => c.grossCharges),
      allowedAmount: sum(cs, (c) => c.allowedAmount),
      deniedAllowed: sum(ds, (d) => d.deniedAllowed),
      recoveries: sum(ds, (d) => d.recoveries),
      writeOffs: sum(ds, (d) => d.writeOffs),
      adjustments: sum(ds, (d) => d.adjustments),
      reworkHours: sum(ds, (d) => d.reworkHours),
      preventableDenials: sum(ds, (d) => d.preventableDenials),
    };
  };
  return {
    datasetId: DATASET_ID,
    notice: NOTICE,
    asOf: "2026-10-10",
    periodBasis:
      "Submission cohorts; first denial per original claim; resubmissions excluded from denominator. Invented final disposition within 90 days; all cohorts matured by as-of date. Recoveries are cash on originally denied allowed amounts; write-offs and contractual adjustments are disjoint residuals. No patient-level data.",
    facilities: FACILITIES,
    payers: PAYERS,
    services: SERVICES,
    reasons: REASONS,
    sources: SOURCES,
    assumptions: ASSUMPTIONS,
    claims,
    denials,
    quarterly: QUARTERS.map((q) => ({ quarter: q, ...aggregate([q]) })),
    eightQuarter: aggregate(QUARTERS),
    trailingYear: aggregate(QUARTERS.slice(-4)),
  };
}
export type Scenario = ReturnType<typeof buildScenario>;
