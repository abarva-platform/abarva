// DATA2 · Dataset Approval Model tests.
//
// Pure deterministic coverage of the dataset approval lifecycle model.

import {
  buildDatasetApprovalModelSeed,
  evaluateApprovalGate,
  getPermittedActionsForScope,
  getRequiredApproverRoles,
  summarizeDatasetApprovalModel,
  validateDatasetApprovalRecord,
  DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER,
  DATASET_APPROVAL_SCOPES_IN_ORDER,
  type DatasetApprovalRecord,
  type DatasetApprovalScope,
} from '@/lib/data-trust/dataset-approval-model';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDatasetApprovalModelSeed · determinism', () => {
  it('returns a deterministic seed across repeated calls', () => {
    const a = buildDatasetApprovalModelSeed();
    const b = buildDatasetApprovalModelSeed();
    expect(a).toEqual(b);
  });

  it('serialized seed is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildDatasetApprovalModelSeed());
    const b = JSON.stringify(buildDatasetApprovalModelSeed());
    expect(a).toBe(b);
  });

  it('every record carries the deterministic createdFrom marker', () => {
    const records = buildDatasetApprovalModelSeed();
    for (const record of records) {
      expect(record.createdFrom).toBe(
        'deterministic_dataset_approval_model_seed',
      );
    }
  });

  it('returns at least 4 seed records', () => {
    expect(buildDatasetApprovalModelSeed().length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------
// Seed shape
// ---------------------------------------------------------------------

describe('buildDatasetApprovalModelSeed · shape', () => {
  it('approved records have at least one named approver', () => {
    const records = buildDatasetApprovalModelSeed();
    const approvedRecords = records.filter(
      (r) => r.lifecycleState === 'approved',
    );
    expect(approvedRecords.length).toBeGreaterThan(0);
    for (const record of approvedRecords) {
      expect(record.approvers.length).toBeGreaterThan(0);
      for (const approver of record.approvers) {
        expect(approver.approvalIsNamed).toBe(true);
      }
    }
  });

  it('not_requested records have empty approvers and empty permittedScopes', () => {
    const records = buildDatasetApprovalModelSeed();
    const notRequested = records.filter(
      (r) => r.lifecycleState === 'not_requested',
    );
    expect(notRequested.length).toBeGreaterThan(0);
    for (const record of notRequested) {
      expect(record.approvers).toHaveLength(0);
      expect(record.permittedScopes).toHaveLength(0);
    }
  });

  it('all expiry dates are valid ISO format', () => {
    const records = buildDatasetApprovalModelSeed();
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const record of records) {
      expect(isoPattern.test(record.expiresAt)).toBe(true);
    }
  });

  it('covers at least 2 distinct lifecycle states', () => {
    const records = buildDatasetApprovalModelSeed();
    const states = new Set(records.map((r) => r.lifecycleState));
    expect(states.size).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------
// validateDatasetApprovalRecord
// ---------------------------------------------------------------------

describe('validateDatasetApprovalRecord · valid seed records', () => {
  it('all seed records pass validation', () => {
    const records = buildDatasetApprovalModelSeed();
    for (const record of records) {
      const result = validateDatasetApprovalRecord(record);
      expect(result.valid).toBe(true);
      expect(result.reasons).toHaveLength(0);
    }
  });
});

describe('validateDatasetApprovalRecord · rejection cases', () => {
  it('rejects record with missing datasetId', () => {
    const record: DatasetApprovalRecord = {
      datasetId: '',
      sharingLevel: 'L2_summary_aggregate',
      lifecycleState: 'not_requested',
      approvers: [],
      permittedScopes: [],
      createdAt: '2026-01-01',
      expiresAt: '2026-12-31',
      createdFrom: 'deterministic_dataset_approval_model_seed',
    };
    const result = validateDatasetApprovalRecord(record);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('dataset_id_missing');
  });

  it('rejects approved record with no approvers', () => {
    const record: DatasetApprovalRecord = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      lifecycleState: 'approved',
      approvers: [],
      permittedScopes: ['summary_only'],
      createdAt: '2026-01-01',
      expiresAt: '2026-12-31',
      createdFrom: 'deterministic_dataset_approval_model_seed',
    };
    const result = validateDatasetApprovalRecord(record);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(
      'approved_record_requires_at_least_one_named_approver',
    );
  });

  it('rejects non-approved record with permittedScopes', () => {
    const record: DatasetApprovalRecord = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      lifecycleState: 'not_requested',
      approvers: [],
      permittedScopes: ['summary_only'],
      createdAt: '2026-01-01',
      expiresAt: '2026-12-31',
      createdFrom: 'deterministic_dataset_approval_model_seed',
    };
    const result = validateDatasetApprovalRecord(record);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(
      'non_approved_record_must_not_have_permitted_scopes',
    );
  });

  it('rejects record with wrong createdFrom marker', () => {
    const record = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate' as const,
      lifecycleState: 'not_requested' as const,
      approvers: [],
      permittedScopes: [] as DatasetApprovalScope[],
      createdAt: '2026-01-01',
      expiresAt: '2026-12-31',
      createdFrom: 'wrong_marker' as never,
    };
    const result = validateDatasetApprovalRecord(record);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('created_from_marker_invalid');
  });

  it('rejects record with invalid expiry date', () => {
    const record: DatasetApprovalRecord = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      lifecycleState: 'not_requested',
      approvers: [],
      permittedScopes: [],
      createdAt: '2026-01-01',
      expiresAt: 'not-a-date',
      createdFrom: 'deterministic_dataset_approval_model_seed',
    };
    const result = validateDatasetApprovalRecord(record);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('expiry_date_not_iso_date');
  });
});

// ---------------------------------------------------------------------
// evaluateApprovalGate
// ---------------------------------------------------------------------

describe('evaluateApprovalGate · permitted', () => {
  it('permits read_aggregate on an approved L2 record with summary_only scope', () => {
    const records = buildDatasetApprovalModelSeed();
    const kpiRecord = records.find((r) => r.datasetId === 'ds-apex-kpi-summary');
    expect(kpiRecord).toBeDefined();
    const decision = evaluateApprovalGate(
      kpiRecord!,
      'read_aggregate',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(true);
  });

  it('permits evidence_citation on an approved record with evidence_manifest scope', () => {
    const records = buildDatasetApprovalModelSeed();
    const kpiRecord = records.find((r) => r.datasetId === 'ds-apex-kpi-summary');
    expect(kpiRecord).toBeDefined();
    const decision = evaluateApprovalGate(
      kpiRecord!,
      'evidence_citation',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(true);
  });

  it('permits agent_context_build on record with agent_context scope', () => {
    const records = buildDatasetApprovalModelSeed();
    const agentRecord = records.find(
      (r) => r.datasetId === 'ds-apex-agent-performance',
    );
    expect(agentRecord).toBeDefined();
    const decision = evaluateApprovalGate(
      agentRecord!,
      'agent_context_build',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(true);
  });
});

describe('evaluateApprovalGate · blocked', () => {
  it('blocks any non-metadata action on a not_requested record', () => {
    const records = buildDatasetApprovalModelSeed();
    const notRequested = records.find(
      (r) => r.lifecycleState === 'not_requested',
    );
    expect(notRequested).toBeDefined();
    const decision = evaluateApprovalGate(
      notRequested!,
      'read_aggregate',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('approval_not_yet_granted');
  });

  it('blocks action on expired record', () => {
    const records = buildDatasetApprovalModelSeed();
    const approved = records.find((r) => r.lifecycleState === 'approved');
    expect(approved).toBeDefined();
    // Evaluate with a date far past the expiresAt date.
    const decision = evaluateApprovalGate(
      approved!,
      'read_aggregate',
      '2027-12-31',
    );
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('approval_record_expired');
  });

  it('blocks action not covered by permitted scopes', () => {
    const records = buildDatasetApprovalModelSeed();
    // ds-apex-contact-volume-q1 only has summary_only + evidence_manifest.
    const contactRecord = records.find(
      (r) => r.datasetId === 'ds-apex-contact-volume-q1',
    );
    expect(contactRecord).toBeDefined();
    const decision = evaluateApprovalGate(
      contactRecord!,
      'agent_context_build',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('action_not_covered_by_permitted_scopes');
  });

  it('blocks decision_artifact_cite when only summary_only scope is present', () => {
    const records = buildDatasetApprovalModelSeed();
    const contactRecord = records.find(
      (r) => r.datasetId === 'ds-apex-contact-volume-q1',
    );
    expect(contactRecord).toBeDefined();
    const decision = evaluateApprovalGate(
      contactRecord!,
      'decision_artifact_cite',
      '2026-04-01',
    );
    expect(decision.permitted).toBe(false);
  });
});

describe('evaluateApprovalGate · output shape', () => {
  it('decision carries the correct createdFrom marker', () => {
    const records = buildDatasetApprovalModelSeed();
    const kpiRecord = records.find((r) => r.datasetId === 'ds-apex-kpi-summary');
    const decision = evaluateApprovalGate(kpiRecord!, 'read_aggregate', '2026-04-01');
    expect(decision.createdFrom).toBe('deterministic_dataset_approval_model_seed');
  });

  it('decision includes guidance for blocked cases', () => {
    const records = buildDatasetApprovalModelSeed();
    const notRequested = records.find((r) => r.lifecycleState === 'not_requested');
    const decision = evaluateApprovalGate(notRequested!, 'read_aggregate', '2026-04-01');
    expect(decision.guidance.length).toBeGreaterThan(10);
  });

  it('is deterministic for the same inputs', () => {
    const records = buildDatasetApprovalModelSeed();
    const kpiRecord = records.find((r) => r.datasetId === 'ds-apex-kpi-summary')!;
    const a = evaluateApprovalGate(kpiRecord, 'evidence_citation', '2026-04-01');
    const b = evaluateApprovalGate(kpiRecord, 'evidence_citation', '2026-04-01');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// getRequiredApproverRoles / getPermittedActionsForScope
// ---------------------------------------------------------------------

describe('getRequiredApproverRoles', () => {
  it('raw_records scope requires data_owner, security_lead, executive_sponsor', () => {
    const roles = getRequiredApproverRoles('raw_records');
    expect(roles).toContain('data_owner');
    expect(roles).toContain('security_lead');
    expect(roles).toContain('executive_sponsor');
  });

  it('summary_only scope requires only data_owner', () => {
    const roles = getRequiredApproverRoles('summary_only');
    expect(roles).toContain('data_owner');
    expect(roles).toHaveLength(1);
  });
});

describe('getPermittedActionsForScope', () => {
  it('summary_only permits read_metadata and read_aggregate', () => {
    const actions = getPermittedActionsForScope('summary_only');
    expect(actions).toContain('read_metadata');
    expect(actions).toContain('read_aggregate');
    expect(actions).not.toContain('read_raw_records');
    expect(actions).not.toContain('agent_context_build');
  });

  it('raw_records scope permits read_raw_records', () => {
    const actions = getPermittedActionsForScope('raw_records');
    expect(actions).toContain('read_raw_records');
  });

  it('decision_artifact scope permits decision_artifact_cite', () => {
    const actions = getPermittedActionsForScope('decision_artifact');
    expect(actions).toContain('decision_artifact_cite');
  });
});

// ---------------------------------------------------------------------
// summarizeDatasetApprovalModel
// ---------------------------------------------------------------------

describe('summarizeDatasetApprovalModel', () => {
  it('total matches input length', () => {
    const records = buildDatasetApprovalModelSeed();
    const summary = summarizeDatasetApprovalModel(records, '2026-04-26');
    expect(summary.total).toBe(records.length);
  });

  it('byLifecycleState counts sum to total', () => {
    const records = buildDatasetApprovalModelSeed();
    const summary = summarizeDatasetApprovalModel(records, '2026-04-26');
    const stateTotal = Object.values(summary.byLifecycleState).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(stateTotal).toBe(summary.total);
  });

  it('is deterministic for the same input', () => {
    const records = buildDatasetApprovalModelSeed();
    expect(
      JSON.stringify(summarizeDatasetApprovalModel(records, '2026-04-26')),
    ).toBe(JSON.stringify(summarizeDatasetApprovalModel(records, '2026-04-26')));
  });

  it('returns zero totals for empty input', () => {
    const summary = summarizeDatasetApprovalModel([], '2026-04-26');
    expect(summary.total).toBe(0);
    expect(summary.terminalRecordCount).toBe(0);
    expect(summary.namedApproverTotal).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

describe('DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER', () => {
  it('contains exactly 8 canonical states', () => {
    expect(DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER).toHaveLength(8);
  });

  it('includes approved, rejected, revoked, expired', () => {
    expect(DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER).toContain('approved');
    expect(DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER).toContain('rejected');
    expect(DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER).toContain('revoked');
    expect(DATASET_APPROVAL_LIFECYCLE_STATES_IN_ORDER).toContain('expired');
  });
});

describe('DATASET_APPROVAL_SCOPES_IN_ORDER', () => {
  it('contains exactly 5 canonical scopes', () => {
    expect(DATASET_APPROVAL_SCOPES_IN_ORDER).toHaveLength(5);
  });

  it('includes raw_records scope', () => {
    expect(DATASET_APPROVAL_SCOPES_IN_ORDER).toContain('raw_records');
  });
});
