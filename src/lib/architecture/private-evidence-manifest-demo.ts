// AZLAB4 - Private Evidence Manifest Demo
//
// Deterministic, file-pure read model that demonstrates how AbarVa handles
// client evidence when raw source data is retained exclusively within the
// client's private data plane. No network calls, no model calls, no
// persistence. Every entry carries literal `rawDataRetainedByClient: true`,
// `noRawCopyConfirmed: true`, and `simulatedApproval: true` — these are not
// computed or derived; they are structurally guaranteed.
//
// This module is consumed by Steward's private-data-plane surfaces and by
// the Azure VNET reference lab for governance demonstration. It is the
// AZLAB4 companion to TRUST4 (evidence-manifest-model.ts).

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export type ApprovalState = 'approved' | 'pending' | 'rejected' | 'simulated';
export type EvidenceUsability = 'usable' | 'partial' | 'not_usable' | 'deferred';

export interface PrivateEvidenceManifestEntry {
  entryId: string;
  metricOrValue: string;
  sourceOwner: string;
  sourceSystem: string;
  dateRange: string;
  approvalState: ApprovalState;
  rawDataRetainedByClient: true;   // always true — never moved to SaaS plane
  evidenceUsability: EvidenceUsability;
  citationLocatorPlaceholder: string;
  governanceFlags: string[];
  noRawCopyConfirmed: true;        // always true
  simulatedApproval: true;         // always true
}

export interface PrivateEvidenceManifestDemo {
  manifestId: string;
  generatedAt: string;
  deterministicOnly: true;
  isSimulatedDemo: true;
  totalEntries: number;
  usableEntries: number;
  pendingEntries: number;
  entries: PrivateEvidenceManifestEntry[];
  noRawCopyCaveat: string;
  simulationCaveat: string;
}

// ---------------------------------------------------------------------
// Seed entries — 8 deterministic manifest rows across business areas.
// ---------------------------------------------------------------------

const SEED_ENTRIES: readonly PrivateEvidenceManifestEntry[] = [
  // -------------------------------------------------------------------
  // 1. HR Analytics
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-hr-attrition-2026q1',
    metricOrValue: 'Q1 2026 voluntary attrition rate: 8.3% (annualised)',
    sourceOwner: 'Chief People Officer — Workday HRIS team',
    sourceSystem: 'Workday HCM',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'usable',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-hr-attrition-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: ['GDPR', 'data_classification:confidential', 'HR_sensitive', 'EU_data_residency'],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 2. Sales Data
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-sales-pipeline-2026q1',
    metricOrValue: 'Q1 2026 new-logo pipeline value: $42M across 87 opportunities',
    sourceOwner: 'VP Sales Operations — Salesforce CRM admin',
    sourceSystem: 'Salesforce Sales Cloud',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'usable',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-sales-pipeline-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'data_classification:confidential',
      'competitive_sensitivity:high',
      'deal_stage_pii:partial',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 3. Financial Metrics
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-finance-opex-2026q1',
    metricOrValue: 'Q1 2026 AI programme operating expenditure: $1.8M (budgeted $2.1M)',
    sourceOwner: 'FP&A Director — Oracle ERP finance team',
    sourceSystem: 'Oracle Fusion ERP',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'usable',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-finance-opex-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'SOX_controlled',
      'data_classification:restricted',
      'financial_material',
      'audit_trail_required',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 4. Supply Chain
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-supply-chain-otd-2026q1',
    metricOrValue: 'Q1 2026 on-time delivery rate: 91.4% (target 95%)',
    sourceOwner: 'VP Supply Chain — SAP SCM integration lead',
    sourceSystem: 'SAP S/4HANA Supply Chain',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'partial',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-supply-chain-otd-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'data_classification:confidential',
      'supplier_pii:none',
      'operational_sensitivity:medium',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 5. Customer Data
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-customer-nps-2026q1',
    metricOrValue: 'Q1 2026 Net Promoter Score: 42 (n=3,200 respondents)',
    sourceOwner: 'VP Customer Experience — Qualtrics programme owner',
    sourceSystem: 'Qualtrics XM',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'usable',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-customer-nps-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'GDPR',
      'CCPA',
      'data_classification:confidential',
      'customer_pii:pseudonymised',
      'consent_basis:survey_opt_in',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 6. IT Telemetry
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-it-aiservice-latency-2026q1',
    metricOrValue: 'Q1 2026 AI inference service P95 latency: 340ms (SLA 500ms)',
    sourceOwner: 'Platform Engineering Lead — Observability team',
    sourceSystem: 'Datadog APM',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'usable',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-it-aiservice-latency-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'data_classification:internal',
      'operational_telemetry',
      'no_pii',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 7. Contact Centre Operations
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-cc-aht-2026q1',
    metricOrValue: 'Q1 2026 contact centre average handle time: 4m 52s (baseline 6m 10s)',
    sourceOwner: 'Contact Centre Operations Director — Genesys admin',
    sourceSystem: 'Genesys Cloud CX',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'pending',
    rawDataRetainedByClient: true,
    evidenceUsability: 'partial',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-cc-aht-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'data_classification:confidential',
      'call_recording_reference:none',
      'agent_pii:pseudonymised',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },

  // -------------------------------------------------------------------
  // 8. Risk & Compliance
  // -------------------------------------------------------------------
  {
    entryId: 'pvt-manifest-risk-ai-incidents-2026q1',
    metricOrValue: 'Q1 2026 AI-related risk incidents logged: 3 (severity: 1 medium, 2 low)',
    sourceOwner: 'Chief Risk Officer — GRC platform owner',
    sourceSystem: 'ServiceNow GRC',
    dateRange: '2026-01-01/2026-03-31',
    approvalState: 'simulated',
    rawDataRetainedByClient: true,
    evidenceUsability: 'deferred',
    citationLocatorPlaceholder:
      'Evidence manifest entry ID: pvt-manifest-risk-ai-incidents-2026q1 — retrieve from Private Data Plane API',
    governanceFlags: [
      'data_classification:restricted',
      'legal_hold_possible',
      'audit_trail_required',
      'GDPR',
      'EU_AI_Act:incident_log',
    ],
    noRawCopyConfirmed: true,
    simulatedApproval: true,
  },
];

// ---------------------------------------------------------------------
// Caveats — verbatim per spec.
// ---------------------------------------------------------------------

const NO_RAW_COPY_CAVEAT =
  "Raw source data is retained exclusively within the client's private data plane. " +
  'AbarVa holds only structured evidence manifests — no raw records are ever copied to the SaaS control plane.';

const SIMULATION_CAVEAT =
  'This is a simulated demo manifest. ' +
  'Approval states, evidence usability, and citation locators are illustrative only.';

// ---------------------------------------------------------------------
// Public builder.
// ---------------------------------------------------------------------

export function buildPrivateEvidenceManifestDemo(): PrivateEvidenceManifestDemo {
  const entries = SEED_ENTRIES as PrivateEvidenceManifestEntry[];

  const usableEntries = entries.filter((e) => e.evidenceUsability === 'usable').length;
  const pendingEntries = entries.filter((e) => e.approvalState === 'pending').length;

  return {
    manifestId: 'pvt-evidence-manifest-demo-azlab4',
    generatedAt: '2026-04-26',
    deterministicOnly: true,
    isSimulatedDemo: true,
    totalEntries: entries.length,
    usableEntries,
    pendingEntries,
    entries,
    noRawCopyCaveat: NO_RAW_COPY_CAVEAT,
    simulationCaveat: SIMULATION_CAVEAT,
  };
}
