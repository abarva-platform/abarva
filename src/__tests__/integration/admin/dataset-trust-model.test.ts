// TRUST1 · Dataset Trust Model + Data Sharing Levels tests.
//
// Pure deterministic coverage of the dataset trust read model.

import {
  buildDatasetTrustModel,
  evaluateDatasetTrustDecision,
  listDatasetSharingLevels,
  summarizeDatasetTrustReadiness,
  DATASET_APPROVAL_STATES_IN_ORDER,
  DATASET_SHARING_LEVELS_IN_ORDER,
  DATASET_TRUST_LADDER_STATES_IN_ORDER,
  type DatasetTrustDecision,
  type DatasetTrustDecisionInput,
} from '@/lib/admin/dataset-trust-model';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDatasetTrustModel · determinism', () => {
  it('returns a deterministic model across repeated calls', () => {
    const a = buildDatasetTrustModel();
    const b = buildDatasetTrustModel();
    expect(a).toEqual(b);
  });

  it('serialized model is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildDatasetTrustModel());
    const b = JSON.stringify(buildDatasetTrustModel());
    expect(a).toBe(b);
  });

  it('generatedFrom is deterministic_dataset_trust_seed', () => {
    const m = buildDatasetTrustModel();
    expect(m.generatedFrom).toBe('deterministic_dataset_trust_seed');
  });
});

// ---------------------------------------------------------------------
// All 5 sharing levels and all 5 ladder states present
// ---------------------------------------------------------------------

describe('canonical sharing levels and ladder states', () => {
  it('exposes all 5 canonical sharing levels in ordinal order', () => {
    const expected = [
      'L0_public_external',
      'L1_metadata_only',
      'L2_summary_aggregate',
      'L3_redacted_extract',
      'L4_sensitive_raw_data',
    ];
    expect(DATASET_SHARING_LEVELS_IN_ORDER).toEqual(expected);
    const m = buildDatasetTrustModel();
    expect(m.sharingLevels.map((d) => d.level)).toEqual(expected);
    for (let i = 0; i < m.sharingLevels.length; i++) {
      expect(m.sharingLevels[i].ordinal).toBe(i);
    }
  });

  it('listDatasetSharingLevels returns all 5 levels in ordinal order', () => {
    const list = listDatasetSharingLevels();
    expect(list.length).toBe(5);
    expect(list.map((d) => d.level)).toEqual(DATASET_SHARING_LEVELS_IN_ORDER);
  });

  it('exposes all 5 canonical trust ladder states in ordinal order', () => {
    const expected = [
      'loaded',
      'available',
      'usable_evidence',
      'agent_usable',
      'decision_grade',
    ];
    expect(DATASET_TRUST_LADDER_STATES_IN_ORDER).toEqual(expected);
    const m = buildDatasetTrustModel();
    expect(m.ladderStates.map((d) => d.state)).toEqual(expected);
    for (let i = 0; i < m.ladderStates.length; i++) {
      expect(m.ladderStates[i].ordinal).toBe(i);
    }
  });

  it('only L4 marks rawDataExposed and approvalRequired', () => {
    const list = listDatasetSharingLevels();
    for (const d of list) {
      if (d.level === 'L4_sensitive_raw_data') {
        expect(d.rawDataExposed).toBe(true);
        expect(d.approvalRequired).toBe(true);
      } else {
        expect(d.rawDataExposed).toBe(false);
        expect(d.approvalRequired).toBe(false);
      }
    }
  });

  it('only agent_usable and decision_grade permit agent use; only decision_grade permits decision use', () => {
    const m = buildDatasetTrustModel();
    for (const d of m.ladderStates) {
      if (d.state === 'agent_usable' || d.state === 'decision_grade') {
        expect(d.permitsAgentUse).toBe(true);
      } else {
        expect(d.permitsAgentUse).toBe(false);
      }
      if (d.state === 'decision_grade') {
        expect(d.permitsDecisionUse).toBe(true);
      } else {
        expect(d.permitsDecisionUse).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------
// L4 sensitive raw data requires explicit approval
// ---------------------------------------------------------------------

describe('L4 sensitive raw data requires explicit approval', () => {
  function l4Base(): DatasetTrustDecisionInput {
    return {
      datasetId: 'ds:trust1:l4-fixture',
      trustLevel: 'L4_sensitive_raw_data',
      ladderState: 'decision_grade',
      sensitivity: 'restricted_pii',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      approvalState: 'approved',
      requestsRawRecords: true,
      requestsAgentUse: false,
    };
  }

  it('blocks L4 raw record read when approval is missing (required_not_requested)', () => {
    const decision = evaluateDatasetTrustDecision({
      ...l4Base(),
      approvalState: 'required_not_requested',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('rule_L4_requires_explicit_approval');
    expect(decision.reasons).toContain(
      'rule_raw_records_require_explicit_approval',
    );
  });

  it('blocks L4 raw record read when approval is requested_pending', () => {
    const decision = evaluateDatasetTrustDecision({
      ...l4Base(),
      approvalState: 'requested_pending',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('rule_L4_requires_explicit_approval');
  });

  it('blocks L4 raw record read when approval is denied (no fake approval)', () => {
    const decision = evaluateDatasetTrustDecision({
      ...l4Base(),
      approvalState: 'denied',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('rule_no_fake_approval');
    expect(decision.reasons).toContain('rule_L4_requires_explicit_approval');
  });

  it('blocks L4 raw record read when approval is expired', () => {
    const decision = evaluateDatasetTrustDecision({
      ...l4Base(),
      approvalState: 'expired',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('rule_no_fake_approval');
  });

  it('permits L4 raw record read only when approval is explicitly approved', () => {
    const decision = evaluateDatasetTrustDecision(l4Base());
    expect(decision.permitted).toBe(true);
    expect(decision.reasons).toEqual([]);
    expect(decision.approvalState).toBe('approved');
  });

  it('blocks raw record asks at non-L4 levels', () => {
    for (const level of [
      'L0_public_external',
      'L1_metadata_only',
      'L2_summary_aggregate',
      'L3_redacted_extract',
    ] as const) {
      const decision = evaluateDatasetTrustDecision({
        ...l4Base(),
        trustLevel: level,
        approvalState: 'approved',
      });
      expect(decision.permitted).toBe(false);
      expect(decision.reasons).toContain('rule_raw_records_only_via_L4');
    }
  });
});

// ---------------------------------------------------------------------
// L1 metadata-only supports low-risk discovery
// ---------------------------------------------------------------------

describe('L1 metadata-only supports low-risk discovery', () => {
  it('permits L1 metadata-only discovery without raw access or approval', () => {
    const decision = evaluateDatasetTrustDecision({
      datasetId: 'ds:trust1:l1-discovery',
      trustLevel: 'L1_metadata_only',
      ladderState: 'available',
      sensitivity: 'internal',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'not_required',
      requestsRawRecords: false,
      requestsAgentUse: false,
    });
    expect(decision.permitted).toBe(true);
    expect(decision.reasons).toEqual([]);
    expect(decision.trustLevel).toBe('L1_metadata_only');
    expect(decision.ladderState).toBe('available');
  });

  it('L1 default agent-use policy is metadata_only and approval is not required', () => {
    const list = listDatasetSharingLevels();
    const l1 = list.find((d) => d.level === 'L1_metadata_only');
    expect(l1).toBeTruthy();
    expect(l1!.approvalRequired).toBe(false);
    expect(l1!.rawDataExposed).toBe(false);
    expect(l1!.defaultAgentUsePolicy).toBe('metadata_only');
  });
});

// ---------------------------------------------------------------------
// Agent use blocked without explicit policy
// ---------------------------------------------------------------------

describe('agent use blocked without explicit policy', () => {
  function agentBase(): DatasetTrustDecisionInput {
    return {
      datasetId: 'ds:trust1:agent-fixture',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'agent_usable',
      sensitivity: 'confidential',
      hasAgentUsePolicy: true,
      hasEvidenceManifest: true,
      approvalState: 'not_required',
      requestsRawRecords: false,
      requestsAgentUse: true,
    };
  }

  it('blocks agent use when no agent-use policy is attached', () => {
    const decision = evaluateDatasetTrustDecision({
      ...agentBase(),
      hasAgentUsePolicy: false,
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain(
      'rule_agent_use_requires_explicit_policy',
    );
    expect(decision.agentUsePolicy).toBe('denied_by_default');
  });

  it('blocks agent use when ladder state is only available', () => {
    const decision = evaluateDatasetTrustDecision({
      ...agentBase(),
      ladderState: 'available',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain(
      'rule_available_is_not_agent_usable',
    );
    expect(decision.reasons).toContain(
      'rule_agent_use_requires_agent_usable_state',
    );
  });

  it('blocks agent use when ladder state is only loaded', () => {
    const decision = evaluateDatasetTrustDecision({
      ...agentBase(),
      ladderState: 'loaded',
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons).toContain('rule_loaded_is_not_usable');
    expect(decision.reasons).toContain(
      'rule_agent_use_requires_agent_usable_state',
    );
  });

  it('permits agent use when policy is attached and ladder is agent_usable', () => {
    const decision = evaluateDatasetTrustDecision(agentBase());
    expect(decision.permitted).toBe(true);
    expect(decision.reasons).toEqual([]);
  });

  it('permits agent use at decision_grade with attached policy', () => {
    const decision = evaluateDatasetTrustDecision({
      ...agentBase(),
      ladderState: 'decision_grade',
    });
    expect(decision.permitted).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Decision shape and summary aggregation
// ---------------------------------------------------------------------

describe('DatasetTrustDecision shape', () => {
  it('every decision carries the required fields and seed marker', () => {
    const decision = evaluateDatasetTrustDecision({
      datasetId: 'ds:trust1:shape-fixture',
      trustLevel: 'L2_summary_aggregate',
      ladderState: 'usable_evidence',
      sensitivity: 'confidential',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: true,
      approvalState: 'not_required',
      requestsRawRecords: false,
      requestsAgentUse: false,
    });
    expect(typeof decision.permitted).toBe('boolean');
    expect(DATASET_SHARING_LEVELS_IN_ORDER).toContain(decision.trustLevel);
    expect(DATASET_TRUST_LADDER_STATES_IN_ORDER).toContain(decision.ladderState);
    expect(DATASET_APPROVAL_STATES_IN_ORDER).toContain(decision.approvalState);
    expect(Array.isArray(decision.reasons)).toBe(true);
    expect(typeof decision.guidance).toBe('string');
    expect(decision.guidance.length).toBeGreaterThan(0);
    expect(decision.createdFrom).toBe('deterministic_dataset_trust_seed');
  });

  it('blocked decisions always carry a non-empty reasons list', () => {
    const decision = evaluateDatasetTrustDecision({
      datasetId: 'ds:trust1:blocked-fixture',
      trustLevel: 'L4_sensitive_raw_data',
      ladderState: 'available',
      sensitivity: 'restricted_pii',
      hasAgentUsePolicy: false,
      hasEvidenceManifest: false,
      approvalState: 'required_not_requested',
      requestsRawRecords: true,
      requestsAgentUse: true,
    });
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.length).toBeGreaterThan(0);
  });
});

describe('summarizeDatasetTrustReadiness', () => {
  function makeDecisions(): ReadonlyArray<DatasetTrustDecision> {
    return [
      evaluateDatasetTrustDecision({
        datasetId: 'ds:trust1:s1',
        trustLevel: 'L1_metadata_only',
        ladderState: 'available',
        sensitivity: 'internal',
        hasAgentUsePolicy: false,
        hasEvidenceManifest: false,
        approvalState: 'not_required',
        requestsRawRecords: false,
        requestsAgentUse: false,
      }),
      evaluateDatasetTrustDecision({
        datasetId: 'ds:trust1:s2',
        trustLevel: 'L4_sensitive_raw_data',
        ladderState: 'agent_usable',
        sensitivity: 'restricted_pii',
        hasAgentUsePolicy: true,
        hasEvidenceManifest: true,
        approvalState: 'required_not_requested',
        requestsRawRecords: true,
        requestsAgentUse: false,
      }),
      evaluateDatasetTrustDecision({
        datasetId: 'ds:trust1:s3',
        trustLevel: 'L2_summary_aggregate',
        ladderState: 'available',
        sensitivity: 'confidential',
        hasAgentUsePolicy: false,
        hasEvidenceManifest: false,
        approvalState: 'not_required',
        requestsRawRecords: false,
        requestsAgentUse: true,
      }),
    ];
  }

  it('counts permitted vs blocked deterministically', () => {
    const decisions = makeDecisions();
    const s = summarizeDatasetTrustReadiness(decisions);
    expect(s.total).toBe(3);
    expect(s.permittedTotal + s.blockedTotal).toBe(3);
    expect(s.byLevel.L1_metadata_only).toBe(1);
    expect(s.byLevel.L2_summary_aggregate).toBe(1);
    expect(s.byLevel.L4_sensitive_raw_data).toBe(1);
  });

  it('records raw and agent request blocks', () => {
    const decisions = makeDecisions();
    const s = summarizeDatasetTrustReadiness(decisions);
    expect(s.rawRequestsBlocked).toBeGreaterThanOrEqual(1);
    expect(s.agentRequestsBlocked).toBeGreaterThanOrEqual(1);
  });

  it('byLadderState and byApprovalState cover all canonical buckets', () => {
    const s = summarizeDatasetTrustReadiness(makeDecisions());
    expect(new Set(Object.keys(s.byLadderState))).toEqual(
      new Set(DATASET_TRUST_LADDER_STATES_IN_ORDER),
    );
    expect(new Set(Object.keys(s.byApprovalState))).toEqual(
      new Set(DATASET_APPROVAL_STATES_IN_ORDER),
    );
  });

  it('summary on an empty list is zeroed', () => {
    const s = summarizeDatasetTrustReadiness([]);
    expect(s.total).toBe(0);
    expect(s.permittedTotal).toBe(0);
    expect(s.blockedTotal).toBe(0);
    expect(s.rawRequestsBlocked).toBe(0);
    expect(s.agentRequestsBlocked).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Module hygiene (regex-enforced)
// ---------------------------------------------------------------------

describe('module hygiene · dataset-trust-model.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/dataset-trust-model.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Nexus / Sentinel / Atlas / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes or mock.ts', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth implementation or migrations', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });
});

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
