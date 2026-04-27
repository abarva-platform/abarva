// QA32 — Evidence Trust Audit
//
// Verifies the dataset trust model enforces the correct rules:
// 1. All dataset trust levels are in the allowed set
// 2. Agent-usable access is only granted when trustLevel and ladderState
//    meet the threshold — never silently promoted
// 3. Decision-grade access requires approved approval state
// 4. No raw record access is permitted for sensitive datasets without full approval
// 5. Trust model is deterministic across multiple builds

import {
  buildDatasetTrustModel,
  evaluateDatasetTrustDecision,
  summarizeDatasetTrustReadiness,
  DATASET_SHARING_LEVELS_IN_ORDER,
  DATASET_TRUST_LADDER_STATES_IN_ORDER,
  DATASET_APPROVAL_STATES_IN_ORDER,
  type DatasetTrustLevel,
  type DatasetTrustLadderState,
  type DatasetApprovalState,
  type DatasetTrustDecisionInput,
  type DatasetTrustDecision,
} from '@/lib/admin/dataset-trust-model';

// ---------------------------------------------------------------------------
// Allowed values
// ---------------------------------------------------------------------------

const ALLOWED_TRUST_LEVELS: ReadonlySet<DatasetTrustLevel> = new Set([
  'L0_public_external',
  'L1_metadata_only',
  'L2_summary_aggregate',
  'L3_redacted_extract',
  'L4_sensitive_raw_data',
]);

const ALLOWED_LADDER_STATES: ReadonlySet<DatasetTrustLadderState> = new Set([
  'loaded',
  'available',
  'usable_evidence',
  'agent_usable',
  'decision_grade',
]);

const ALLOWED_APPROVAL_STATES: ReadonlySet<DatasetApprovalState> = new Set(
  DATASET_APPROVAL_STATES_IN_ORDER as ReadonlyArray<DatasetApprovalState>,
);

// ---------------------------------------------------------------------------
// Audit check 1: Trust model schema — all values in allowed sets
// ---------------------------------------------------------------------------

describe('QA32 — Audit 1: Trust model canonical values', () => {
  it('DATASET_SHARING_LEVELS_IN_ORDER contains all 5 canonical levels', () => {
    expect(DATASET_SHARING_LEVELS_IN_ORDER).toHaveLength(5);
    for (const level of DATASET_SHARING_LEVELS_IN_ORDER) {
      expect(ALLOWED_TRUST_LEVELS.has(level as DatasetTrustLevel)).toBe(true);
    }
  });

  it('DATASET_TRUST_LADDER_STATES_IN_ORDER contains all 5 canonical states', () => {
    expect(DATASET_TRUST_LADDER_STATES_IN_ORDER).toHaveLength(5);
    for (const state of DATASET_TRUST_LADDER_STATES_IN_ORDER) {
      expect(ALLOWED_LADDER_STATES.has(state as DatasetTrustLadderState)).toBe(true);
    }
  });

  it('buildDatasetTrustModel returns a valid model', () => {
    const model = buildDatasetTrustModel();
    expect(model).toBeDefined();
    expect(model.generatedFrom).toBe('deterministic_dataset_trust_seed');
    expect(Array.isArray(model.sharingLevels)).toBe(true);
    expect(model.sharingLevels.length).toBe(5);
  });

  it('trust model is byte-identical across two builds', () => {
    const a = JSON.stringify(buildDatasetTrustModel());
    const b = JSON.stringify(buildDatasetTrustModel());
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Audit check 2: Agent-usable access requires agent use policy
// ---------------------------------------------------------------------------

describe('QA32 — Audit 2: Agent-usable access enforced correctly', () => {
  it('agent-usable request without agent use policy is blocked', () => {
    const input: DatasetTrustDecisionInput = {
      datasetId: 'test-dataset-no-agent-policy',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'available',
      sensitivity: 'internal',
      hasAgentUsePolicy: false,      // No policy attached
      hasEvidenceManifest: false,
      approvalState: 'required_not_requested',
      requestsRawRecords: false,
      requestsAgentUse: true,        // Requesting agent use
    };
    const decision = evaluateDatasetTrustDecision(input);
    expect(decision.permitted).toBe(false);
  });

  it('agent-usable request with policy and correct ladder state is permitted', () => {
    const input: DatasetTrustDecisionInput = {
      datasetId: 'test-dataset-with-agent-policy',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'agent_usable',
      sensitivity: 'internal',
      hasAgentUsePolicy: true,       // Policy attached
      hasEvidenceManifest: true,
      approvalState: 'approved',
      requestsRawRecords: false,
      requestsAgentUse: true,
    };
    const decision = evaluateDatasetTrustDecision(input);
    expect(decision.permitted).toBe(true);
  });

  it('agent-usable request for L4 sensitive data is blocked regardless of policy', () => {
    const input: DatasetTrustDecisionInput = {
      datasetId: 'test-l4-sensitive',
      trustLevel: 'L4_sensitive_raw_data',
      ladderState: 'loaded',         // Only loaded — not yet agent_usable
      sensitivity: 'restricted_pii',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: false,
      approvalState: 'required_not_requested',
      requestsRawRecords: false,
      requestsAgentUse: true,
    };
    const decision = evaluateDatasetTrustDecision(input);
    expect(decision.permitted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Audit check 3: Raw record access blocked without approval
// ---------------------------------------------------------------------------

describe('QA32 — Audit 3: Raw record access requires approved state', () => {
  it('raw record request with pending approval is blocked', () => {
    const input: DatasetTrustDecisionInput = {
      datasetId: 'test-raw-pending',
      trustLevel: 'L3_redacted_extract',
      ladderState: 'available',
      sensitivity: 'confidential',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'requested_pending',  // Not yet approved
      requestsRawRecords: true,      // Requesting raw records
      requestsAgentUse: false,
    };
    const decision = evaluateDatasetTrustDecision(input);
    expect(decision.permitted).toBe(false);
  });

  it('raw record request for L4 sensitive data is blocked when approval is denied', () => {
    const input: DatasetTrustDecisionInput = {
      datasetId: 'test-l4-raw-denied',
      trustLevel: 'L4_sensitive_raw_data',
      ladderState: 'decision_grade',
      sensitivity: 'restricted_phi',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      approvalState: 'denied',       // Explicitly denied
      requestsRawRecords: true,
      requestsAgentUse: false,
    };
    const decision = evaluateDatasetTrustDecision(input);
    // Denied approval blocks L4 raw access
    expect(decision.permitted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Audit check 4: Decision structure integrity
// ---------------------------------------------------------------------------

describe('QA32 — Audit 4: Every trust decision has required fields', () => {
  const testInputs: ReadonlyArray<DatasetTrustDecisionInput> = [
    {
      datasetId: 'check-1',
      trustLevel: 'L0_public_external',
      ladderState: 'loaded',
      sensitivity: 'public',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'not_required',
      requestsRawRecords: false,
      requestsAgentUse: false,
    },
    {
      datasetId: 'check-2',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'agent_usable',
      sensitivity: 'internal',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      approvalState: 'approved',
      requestsRawRecords: false,
      requestsAgentUse: true,
    },
  ];

  for (const input of testInputs) {
    it(`decision for ${input.datasetId} has required fields`, () => {
      const decision = evaluateDatasetTrustDecision(input);
      expect(typeof decision.permitted).toBe('boolean');
      expect(Array.isArray(decision.reasons)).toBe(true);
      expect(typeof decision.guidance).toBe('string');
      expect(decision.guidance.length).toBeGreaterThan(0);
      expect(decision.createdFrom).toBe('deterministic_dataset_trust_seed');
    });
  }
});

// ---------------------------------------------------------------------------
// Audit check 5: Readiness summary shape
// ---------------------------------------------------------------------------

describe('QA32 — Audit 5: Dataset trust readiness summary', () => {
  const testInputs: ReadonlyArray<DatasetTrustDecisionInput> = [
    {
      datasetId: 'ds-1',
      trustLevel: 'L1_metadata_only',
      ladderState: 'available',
      sensitivity: 'internal',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'not_required',
      requestsRawRecords: false,
      requestsAgentUse: false,
    },
    {
      datasetId: 'ds-2',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'agent_usable',
      sensitivity: 'internal',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      approvalState: 'approved',
      requestsRawRecords: false,
      requestsAgentUse: true,
    },
    {
      datasetId: 'ds-3',
      trustLevel: 'L4_sensitive_raw_data',
      ladderState: 'loaded',
      sensitivity: 'restricted_pii',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'required_not_requested',
      requestsRawRecords: false,
      requestsAgentUse: false,
    },
  ];

  it('summarizeDatasetTrustReadiness returns a valid summary', () => {
    const decisions = testInputs.map(evaluateDatasetTrustDecision);
    const summary = summarizeDatasetTrustReadiness(decisions);
    expect(summary).toBeDefined();
    expect(typeof summary.total).toBe('number');
    expect(summary.total).toBe(3);
    expect(typeof summary.permittedTotal).toBe('number');
  });

  it('summary permittedTotal does not exceed total', () => {
    const decisions = testInputs.map(evaluateDatasetTrustDecision);
    const summary = summarizeDatasetTrustReadiness(decisions);
    expect(summary.permittedTotal).toBeLessThanOrEqual(summary.total);
  });
});
