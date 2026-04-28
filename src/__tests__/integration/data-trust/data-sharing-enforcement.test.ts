// DATA1 · Data Sharing Levels L0-L4 Enforcement tests.
//
// Pure deterministic coverage of the data sharing enforcement layer.

import {
  buildDataSharingEnforcementSeed,
  evaluateDataSharingEnforcement,
  summarizeDataSharingEnforcement,
  DATA_SHARING_ACTIONS_IN_ORDER,
  DATA_SHARING_LEVELS_IN_ORDER,
  type DataSharingEnforcementInput,
} from '@/lib/data-trust/data-sharing-enforcement';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDataSharingEnforcementSeed · determinism', () => {
  it('returns a deterministic seed across repeated calls', () => {
    const a = buildDataSharingEnforcementSeed();
    const b = buildDataSharingEnforcementSeed();
    expect(a).toEqual(b);
  });

  it('serialized seed is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildDataSharingEnforcementSeed());
    const b = JSON.stringify(buildDataSharingEnforcementSeed());
    expect(a).toBe(b);
  });

  it('returns at least 4 seed decisions', () => {
    const seed = buildDataSharingEnforcementSeed();
    expect(seed.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------
// evaluateDataSharingEnforcement · sharing level rules
// ---------------------------------------------------------------------

describe('evaluateDataSharingEnforcement · sharing level gate', () => {
  it('permits read_metadata at L1+', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L1_metadata_only',
      action: 'read_metadata',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('blocks read_metadata at L0 (below L1 minimum)', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L0_public_external',
      action: 'read_metadata',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain(
      'sharing_level_below_minimum_for_action',
    );
  });

  it('permits read_aggregate at L2+', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('blocks read_aggregate at L1 (below L2 minimum)', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L1_metadata_only',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
  });

  it('permits read_redacted_extract at L3+', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L3_redacted_extract',
      action: 'read_redacted_extract',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('blocks read_redacted_extract at L2', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'read_redacted_extract',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
  });
});

// ---------------------------------------------------------------------
// evaluateDataSharingEnforcement · raw record rules
// ---------------------------------------------------------------------

describe('evaluateDataSharingEnforcement · raw record gate', () => {
  it('blocks read_raw_records without L4 + named approval', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L3_redacted_extract',
      action: 'read_raw_records',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('raw_read_requires_L4_sharing_level');
    expect(decision.reasons).toContain('raw_read_requires_named_approval');
  });

  it('blocks read_raw_records at L4 without named approval', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L4_sensitive_raw_data',
      action: 'read_raw_records',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('raw_read_requires_named_approval');
  });

  it('permits read_raw_records at L4 WITH named approval', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L4_sensitive_raw_data',
      action: 'read_raw_records',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: true,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('L4 non-metadata action is blocked without named approval', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L4_sensitive_raw_data',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('L4_requires_named_approval');
  });
});

// ---------------------------------------------------------------------
// evaluateDataSharingEnforcement · agent context gate
// ---------------------------------------------------------------------

describe('evaluateDataSharingEnforcement · agent context gate', () => {
  it('blocks agent_context_build without agent-use policy', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'agent_context_build',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain(
      'agent_context_build_requires_agent_use_policy',
    );
  });

  it('permits agent_context_build at L2+ with agent-use policy', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'agent_context_build',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });
});

// ---------------------------------------------------------------------
// evaluateDataSharingEnforcement · evidence citation gate
// ---------------------------------------------------------------------

describe('evaluateDataSharingEnforcement · citation gate', () => {
  it('blocks evidence_citation without evidence manifest', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L1_metadata_only',
      action: 'evidence_citation',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('citation_requires_evidence_manifest');
  });

  it('permits evidence_citation at L1+ with evidence manifest', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L1_metadata_only',
      action: 'evidence_citation',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      manifestVerification: 'self_attested',
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('blocks decision_artifact_cite with self_attested verification', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'decision_artifact_cite',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      manifestVerification: 'self_attested',
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain(
      'decision_citation_requires_co_signed_or_audited',
    );
  });

  it('permits decision_artifact_cite with audited verification', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'decision_artifact_cite',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      manifestVerification: 'audited',
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });

  it('permits decision_artifact_cite with co_signed verification', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'decision_artifact_cite',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      manifestVerification: 'co_signed',
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
  });
});

// ---------------------------------------------------------------------
// evaluateDataSharingEnforcement · output shape
// ---------------------------------------------------------------------

describe('evaluateDataSharingEnforcement · output shape', () => {
  it('permitted decisions have empty reasons array', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(true);
    expect(decision.reasons).toHaveLength(0);
  });

  it('blocked decisions have non-empty reasons array', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L0_public_external',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.length).toBeGreaterThan(0);
  });

  it('decision carries the correct createdFrom marker', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L2_summary_aggregate',
      action: 'read_aggregate',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      hasNamedApproval: false,
    };
    const decision = evaluateDataSharingEnforcement(input);
    expect(decision.createdFrom).toBe(
      'deterministic_data_sharing_enforcement_seed',
    );
  });

  it('is deterministic for the same input', () => {
    const input: DataSharingEnforcementInput = {
      datasetId: 'ds-test',
      sharingLevel: 'L3_redacted_extract',
      action: 'agent_context_build',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      manifestVerification: 'owner_signed',
      hasNamedApproval: false,
    };
    const a = evaluateDataSharingEnforcement(input);
    const b = evaluateDataSharingEnforcement(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// summarizeDataSharingEnforcement
// ---------------------------------------------------------------------

describe('summarizeDataSharingEnforcement', () => {
  it('returns zeros for empty input', () => {
    const summary = summarizeDataSharingEnforcement([]);
    expect(summary.total).toBe(0);
    expect(summary.permittedTotal).toBe(0);
    expect(summary.blockedTotal).toBe(0);
  });

  it('total matches input length', () => {
    const seed = buildDataSharingEnforcementSeed();
    const summary = summarizeDataSharingEnforcement(seed);
    expect(summary.total).toBe(seed.length);
  });

  it('permittedTotal + blockedTotal == total', () => {
    const seed = buildDataSharingEnforcementSeed();
    const summary = summarizeDataSharingEnforcement(seed);
    expect(summary.permittedTotal + summary.blockedTotal).toBe(summary.total);
  });

  it('byAction counts sum to total', () => {
    const seed = buildDataSharingEnforcementSeed();
    const summary = summarizeDataSharingEnforcement(seed);
    const actionTotal = Object.values(summary.byAction).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(actionTotal).toBe(summary.total);
  });

  it('bySharingLevel counts sum to total', () => {
    const seed = buildDataSharingEnforcementSeed();
    const summary = summarizeDataSharingEnforcement(seed);
    const levelTotal = Object.values(summary.bySharingLevel).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(levelTotal).toBe(summary.total);
  });
});

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

describe('DATA_SHARING_ACTIONS_IN_ORDER', () => {
  it('contains exactly 7 canonical actions', () => {
    expect(DATA_SHARING_ACTIONS_IN_ORDER).toHaveLength(7);
  });

  it('contains read_raw_records', () => {
    expect(DATA_SHARING_ACTIONS_IN_ORDER).toContain('read_raw_records');
  });
});

describe('DATA_SHARING_LEVELS_IN_ORDER', () => {
  it('contains exactly 5 canonical levels', () => {
    expect(DATA_SHARING_LEVELS_IN_ORDER).toHaveLength(5);
  });

  it('starts with L0 and ends with L4', () => {
    expect(DATA_SHARING_LEVELS_IN_ORDER[0]).toBe('L0_public_external');
    expect(DATA_SHARING_LEVELS_IN_ORDER[4]).toBe('L4_sensitive_raw_data');
  });
});
