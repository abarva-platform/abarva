// TRUST3 · Dataset Approval Workflow tests.
//
// Pure deterministic coverage of the dataset approval workflow read
// model. No live runtime, no model invocation, no auth imports.

import {
  DATASET_APPROVAL_STATES_IN_ORDER,
  DATASET_APPROVAL_ROLES_IN_ORDER,
  DATASET_APPROVAL_PURPOSES_IN_ORDER,
  buildDatasetApprovalWorkflow,
  evaluateDatasetApprovalRequest,
  summarizeDatasetApprovals,
  getRevokedOrExpiredDatasets,
  type DatasetApprovalDecision,
  type DatasetApprovalRequest,
  type DatasetApprovalState,
} from '@/lib/admin/dataset-approval-workflow';

// ---------------------------------------------------------------------
// Determinism · byte-equal output
// ---------------------------------------------------------------------

describe('TRUST3 · dataset approval workflow · determinism', () => {
  it('buildDatasetApprovalWorkflow returns identical output across calls', () => {
    const a = buildDatasetApprovalWorkflow();
    const b = buildDatasetApprovalWorkflow();
    expect(a).toEqual(b);
  });

  it('serialized workflow is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildDatasetApprovalWorkflow());
    const b = JSON.stringify(buildDatasetApprovalWorkflow());
    expect(a).toBe(b);
  });

  it('generatedFrom is the canonical seed marker', () => {
    const w = buildDatasetApprovalWorkflow();
    expect(w.generatedFrom).toBe(
      'deterministic_dataset_approval_workflow_seed',
    );
  });

  it('every decision carries the canonical createdFrom marker', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-1:summary_use',
      datasetId: 'ds-1',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'summary_use',
      state: 'approved_for_summary',
      reviews: ['data_owner'],
      conditions: [],
    });
    expect(d.createdFrom).toBe(
      'deterministic_dataset_approval_workflow_seed',
    );
  });

  it('evaluateDatasetApprovalRequest returns identical output across calls for identical input', () => {
    const req: DatasetApprovalRequest = {
      requestId: 'dataset_approval:ds-2:agent_use',
      datasetId: 'ds-2',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'agent_use',
      state: 'approved_for_agent_use',
      reviews: ['data_owner', 'security_review_lead'],
      conditions: ['named_purpose_only'],
    };
    const a = evaluateDatasetApprovalRequest(req);
    const b = evaluateDatasetApprovalRequest(req);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// All 11 canonical states represented in fixture and catalog
// ---------------------------------------------------------------------

describe('TRUST3 · all 11 canonical states represented', () => {
  it('canonical state ordering covers all 11 states', () => {
    const expected = [
      'requested',
      'owner_review',
      'security_review',
      'governance_review',
      'approved_for_summary',
      'approved_for_evidence',
      'approved_for_agent_use',
      'approved_for_deliverables',
      'rejected',
      'revoked',
      'expired',
    ];
    expect(DATASET_APPROVAL_STATES_IN_ORDER).toEqual(expected);
    expect(DATASET_APPROVAL_STATES_IN_ORDER.length).toBe(11);
  });

  it('workflow catalog contains a descriptor for every canonical state', () => {
    const w = buildDatasetApprovalWorkflow();
    const stateSet = new Set(w.states.map((s) => s.state));
    for (const s of DATASET_APPROVAL_STATES_IN_ORDER) {
      expect(stateSet.has(s)).toBe(true);
    }
    expect(w.states.length).toBe(11);
  });

  it('canonical roles ordering covers all 5 roles', () => {
    expect(DATASET_APPROVAL_ROLES_IN_ORDER.length).toBe(5);
    const expected = [
      'data_owner',
      'security_review_lead',
      'governance_review_lead',
      'tenant_admin',
      'abarva_steward',
    ];
    expect(DATASET_APPROVAL_ROLES_IN_ORDER).toEqual(expected);
  });

  it('fixture exercises every one of the 11 states', () => {
    const fixture = buildAllStatesFixture();
    const seen = new Set(fixture.map((r) => r.state));
    for (const s of DATASET_APPROVAL_STATES_IN_ORDER) {
      expect(seen.has(s)).toBe(true);
    }
    expect(fixture.length).toBe(11);
  });

  it('summary buckets cover every canonical state and purpose', () => {
    const decisions = buildAllStatesFixture().map(evaluateDatasetApprovalRequest);
    const s = summarizeDatasetApprovals(decisions);
    for (const state of DATASET_APPROVAL_STATES_IN_ORDER) {
      expect(state in s.byState).toBe(true);
    }
    for (const purpose of DATASET_APPROVAL_PURPOSES_IN_ORDER) {
      expect(purpose in s.byPurpose).toBe(true);
    }
    expect(s.total).toBe(decisions.length);
    expect(s.permittedTotal + s.blockedTotal).toBe(s.total);
  });
});

// ---------------------------------------------------------------------
// L4 sensitive raw data requires data_owner + governance_review_lead
// ---------------------------------------------------------------------

describe('TRUST3 · L4 sensitive raw data requires data_owner + governance_review_lead', () => {
  function l4Base(state: DatasetApprovalState): DatasetApprovalRequest {
    return {
      requestId: `dataset_approval:ds-l4:${state}`,
      datasetId: 'ds-l4',
      trustLevel: 'L4_sensitive_raw_data',
      purpose: 'evidence_use',
      state,
      reviews: [],
      conditions: [],
    };
  }

  it('L4 with no reviews is blocked for missing both reviewers', () => {
    const d = evaluateDatasetApprovalRequest(
      l4Base('approved_for_evidence'),
    );
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('l4_missing_owner_review');
    expect(d.blockReasons).toContain('l4_missing_governance_review');
    expect(d.auditBasis).toContain('l4_requires_owner_and_governance');
  });

  it('L4 with only data_owner is blocked for missing governance', () => {
    const d = evaluateDatasetApprovalRequest({
      ...l4Base('approved_for_evidence'),
      reviews: ['data_owner'],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('l4_missing_governance_review');
    expect(d.blockReasons).not.toContain('l4_missing_owner_review');
  });

  it('L4 with only governance_review_lead is blocked for missing owner', () => {
    const d = evaluateDatasetApprovalRequest({
      ...l4Base('approved_for_evidence'),
      reviews: ['governance_review_lead'],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('l4_missing_owner_review');
    expect(d.blockReasons).not.toContain('l4_missing_governance_review');
  });

  it('L4 with both data_owner and governance_review_lead clears the L4 reviewer requirement', () => {
    const d = evaluateDatasetApprovalRequest({
      ...l4Base('approved_for_evidence'),
      reviews: ['data_owner', 'governance_review_lead'],
    });
    expect(d.permitted).toBe(true);
    expect(d.blockReasons).toEqual([]);
    expect(d.auditBasis).toContain('l4_requires_owner_and_governance');
    expect(d.auditBasis).toContain('state_grants_purpose');
  });

  it('L4 audit basis is emitted regardless of state', () => {
    for (const state of DATASET_APPROVAL_STATES_IN_ORDER) {
      const d = evaluateDatasetApprovalRequest({
        ...l4Base(state),
        reviews: ['data_owner', 'governance_review_lead'],
      });
      expect(d.auditBasis).toContain('l4_requires_owner_and_governance');
    }
  });
});

// ---------------------------------------------------------------------
// revoked / expired blocks ALL use across every purpose
// ---------------------------------------------------------------------

describe('TRUST3 · revoked blocks all use across all purposes', () => {
  it('revoked blocks every purpose regardless of trust level or reviews', () => {
    for (const purpose of DATASET_APPROVAL_PURPOSES_IN_ORDER) {
      const d = evaluateDatasetApprovalRequest({
        requestId: `dataset_approval:ds-rev:${purpose}`,
        datasetId: 'ds-rev',
        trustLevel: 'L2_summary_aggregate',
        purpose,
        state: 'revoked',
        reviews: ['data_owner', 'governance_review_lead', 'security_review_lead'],
        conditions: [],
      });
      expect(d.permitted).toBe(false);
      expect(d.blockReasons).toContain('state_revoked');
      expect(d.auditBasis).toContain('revoked_blocks_all_use');
    }
  });

  it('revoked at L4 still blocks even with both required L4 reviewers', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-l4-rev:agent_use',
      datasetId: 'ds-l4-rev',
      trustLevel: 'L4_sensitive_raw_data',
      purpose: 'agent_use',
      state: 'revoked',
      reviews: ['data_owner', 'governance_review_lead'],
      conditions: [],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('state_revoked');
  });
});

describe('TRUST3 · expired blocks all use across all purposes', () => {
  it('expired blocks every purpose regardless of trust level or reviews', () => {
    for (const purpose of DATASET_APPROVAL_PURPOSES_IN_ORDER) {
      const d = evaluateDatasetApprovalRequest({
        requestId: `dataset_approval:ds-exp:${purpose}`,
        datasetId: 'ds-exp',
        trustLevel: 'L2_summary_aggregate',
        purpose,
        state: 'expired',
        reviews: ['data_owner', 'governance_review_lead', 'security_review_lead'],
        conditions: [],
      });
      expect(d.permitted).toBe(false);
      expect(d.blockReasons).toContain('state_expired');
      expect(d.auditBasis).toContain('expired_blocks_all_use');
    }
  });

  it('getRevokedOrExpiredDatasets returns only revoked and expired decisions', () => {
    const decisions = buildAllStatesFixture().map(evaluateDatasetApprovalRequest);
    const filtered = getRevokedOrExpiredDatasets(decisions);
    for (const d of filtered) {
      expect(['revoked', 'expired']).toContain(d.state);
    }
    const revokedCount = decisions.filter((d) => d.state === 'revoked').length;
    const expiredCount = decisions.filter((d) => d.state === 'expired').length;
    expect(filtered.length).toBe(revokedCount + expiredCount);
  });
});

describe('TRUST3 · rejected blocks all use across all purposes', () => {
  it('rejected blocks every purpose regardless of reviews', () => {
    for (const purpose of DATASET_APPROVAL_PURPOSES_IN_ORDER) {
      const d = evaluateDatasetApprovalRequest({
        requestId: `dataset_approval:ds-rej:${purpose}`,
        datasetId: 'ds-rej',
        trustLevel: 'L2_summary_aggregate',
        purpose,
        state: 'rejected',
        reviews: ['data_owner', 'governance_review_lead'],
        conditions: [],
      });
      expect(d.permitted).toBe(false);
      expect(d.blockReasons).toContain('state_rejected');
      expect(d.auditBasis).toContain('rejected_blocks_all_use');
    }
  });
});

// ---------------------------------------------------------------------
// approved_for_summary does NOT confer approved_for_agent_use
// ---------------------------------------------------------------------

describe('TRUST3 · approved_for_summary does NOT confer agent use', () => {
  it('approved_for_summary blocks agent_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-sum:agent_use',
      datasetId: 'ds-sum',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'agent_use',
      state: 'approved_for_summary',
      reviews: ['data_owner'],
      conditions: [],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('agent_use_not_explicitly_approved');
    expect(d.auditBasis).toContain('agent_use_requires_explicit_agent_approval');
  });

  it('approved_for_evidence also blocks agent_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-evd:agent_use',
      datasetId: 'ds-evd',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'agent_use',
      state: 'approved_for_evidence',
      reviews: ['data_owner', 'governance_review_lead'],
      conditions: [],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain('agent_use_not_explicitly_approved');
  });

  it('approved_for_agent_use permits agent_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-aag:agent_use',
      datasetId: 'ds-aag',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'agent_use',
      state: 'approved_for_agent_use',
      reviews: ['data_owner'],
      conditions: [],
    });
    expect(d.permitted).toBe(true);
    expect(d.blockReasons).toEqual([]);
  });

  it('approved_for_summary still permits summary_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-sum:summary_use',
      datasetId: 'ds-sum',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'summary_use',
      state: 'approved_for_summary',
      reviews: ['data_owner'],
      conditions: [],
    });
    expect(d.permitted).toBe(true);
  });
});

// ---------------------------------------------------------------------
// deliverable use requires approved_for_deliverables AND approved_for_evidence
// ---------------------------------------------------------------------

describe('TRUST3 · deliverable use requires both deliverable AND evidence approval', () => {
  it('approved_for_deliverables without governance review (evidence sign-off) blocks deliverable_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-del:deliverable_use',
      datasetId: 'ds-del',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'deliverable_use',
      state: 'approved_for_deliverables',
      reviews: ['data_owner'],
      conditions: [],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain(
      'deliverable_use_missing_evidence_approval',
    );
  });

  it('approved_for_evidence alone does not unlock deliverable_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-del2:deliverable_use',
      datasetId: 'ds-del2',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'deliverable_use',
      state: 'approved_for_evidence',
      reviews: ['governance_review_lead'],
      conditions: [],
    });
    expect(d.permitted).toBe(false);
    expect(d.blockReasons).toContain(
      'deliverable_use_missing_deliverable_approval',
    );
  });

  it('approved_for_deliverables with governance review permits deliverable_use', () => {
    const d = evaluateDatasetApprovalRequest({
      requestId: 'dataset_approval:ds-del3:deliverable_use',
      datasetId: 'ds-del3',
      trustLevel: 'L2_summary_aggregate',
      purpose: 'deliverable_use',
      state: 'approved_for_deliverables',
      reviews: ['governance_review_lead'],
      conditions: [],
    });
    expect(d.permitted).toBe(true);
    expect(d.blockReasons).toEqual([]);
    expect(d.auditBasis).toContain(
      'deliverable_use_requires_evidence_and_deliverable_approval',
    );
  });
});

// ---------------------------------------------------------------------
// Every decision carries rationale + audit basis
// ---------------------------------------------------------------------

describe('TRUST3 · every decision carries rationale and audit basis', () => {
  it('every decision in the all-states fixture has a non-empty rationale and at least one audit basis tag', () => {
    const decisions = buildAllStatesFixture().map(evaluateDatasetApprovalRequest);
    for (const d of decisions) {
      expect(typeof d.rationale).toBe('string');
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(d.auditBasis.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('blocked decisions populate at least one block reason', () => {
    const decisions = buildAllStatesFixture().map(evaluateDatasetApprovalRequest);
    for (const d of decisions) {
      if (!d.permitted) {
        expect(d.blockReasons.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(d.blockReasons).toEqual([]);
      }
    }
  });

  it('summary reconciles permitted + blocked = total', () => {
    const decisions = buildAllStatesFixture().map(evaluateDatasetApprovalRequest);
    const s = summarizeDatasetApprovals(decisions);
    expect(s.permittedTotal + s.blockedTotal).toBe(s.total);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · no model / runtime / auth imports
// ---------------------------------------------------------------------

describe('TRUST3 · module hygiene · dataset-approval-workflow.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/dataset-approval-workflow.ts',
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

  it('imports DatasetTrustLevel only as a type-only import', () => {
    // The import line must be `import type` (TS strips at compile time).
    expect(codeOnly).toMatch(
      /import type \{ DatasetTrustLevel \} from '@\/lib\/admin\/dataset-trust-model'/,
    );
    // No value-level import from TRUST1 module.
    expect(codeOnly).not.toMatch(
      /^import \{[^}]*\} from '@\/lib\/admin\/dataset-trust-model'/m,
    );
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

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function buildAllStatesFixture(): DatasetApprovalRequest[] {
  // One request per canonical state. The purpose / trust-level shapes
  // exercise the rules across the surface; reviewers are populated
  // generously so that L4 reviewer requirements never act as the
  // primary block reason in this fixture.
  const fixture: Array<{
    state: DatasetApprovalState;
    trustLevel: DatasetApprovalRequest['trustLevel'];
    purpose: DatasetApprovalRequest['purpose'];
  }> = [
    { state: 'requested', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'owner_review', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'security_review', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'governance_review', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'approved_for_summary', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'approved_for_evidence', trustLevel: 'L2_summary_aggregate', purpose: 'evidence_use' },
    { state: 'approved_for_agent_use', trustLevel: 'L2_summary_aggregate', purpose: 'agent_use' },
    { state: 'approved_for_deliverables', trustLevel: 'L2_summary_aggregate', purpose: 'deliverable_use' },
    { state: 'rejected', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'revoked', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
    { state: 'expired', trustLevel: 'L2_summary_aggregate', purpose: 'summary_use' },
  ];
  return fixture.map((f) => ({
    requestId: `dataset_approval:fixture-${f.state}:${f.purpose}`,
    datasetId: `fixture-${f.state}`,
    trustLevel: f.trustLevel,
    purpose: f.purpose,
    state: f.state,
    reviews: ['data_owner', 'security_review_lead', 'governance_review_lead'],
    conditions: [],
  }));
}

function stripComments(src: string): string {
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
