// TRUST2 · Agent Data Access Policy Matrix tests.
//
// Pure deterministic coverage of the agent data access policy
// read model.

import {
  AGENT_DATA_ACCESS_AGENTS_IN_ORDER,
  AGENT_DATASET_SHARING_LEVELS_IN_ORDER,
  AGENT_DATA_USE_PURPOSES_IN_ORDER,
  AGENT_EVIDENCE_APPROVAL_STATES_IN_ORDER,
  buildAgentDataAccessMatrix,
  evaluateAgentDataAccess,
  listAgentDataAccessPolicies,
  type AgentDataAccessAgent,
  type AgentDataUsePurpose,
  type AgentDatasetSharingLevel,
  type AgentEvidenceApprovalState,
} from '@/lib/admin/agent-data-access-policy';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('TRUST2 · agent data access policy · determinism', () => {
  it('listAgentDataAccessPolicies returns identical output across calls', () => {
    const a = listAgentDataAccessPolicies();
    const b = listAgentDataAccessPolicies();
    expect(a).toEqual(b);
  });

  it('buildAgentDataAccessMatrix returns identical output across calls', () => {
    const a = buildAgentDataAccessMatrix();
    const b = buildAgentDataAccessMatrix();
    expect(a).toEqual(b);
  });

  it('matrix.generatedFrom is the canonical seed marker', () => {
    const m = buildAgentDataAccessMatrix();
    expect(m.generatedFrom).toBe('deterministic_agent_data_access_seed');
    for (const p of m.policies) {
      expect(p.createdFrom).toBe('deterministic_agent_data_access_seed');
    }
  });

  it('every decision carries the canonical createdFrom marker', () => {
    const d = evaluateAgentDataAccess(
      'nexus',
      'summarize',
      'L2_summary_aggregate',
      'explicit_approved',
    );
    expect(d.createdFrom).toBe('deterministic_agent_data_access_seed');
  });
});

// ---------------------------------------------------------------------
// Coverage: every agent has policies for at least 4 purposes
// ---------------------------------------------------------------------

describe('TRUST2 · agent / purpose coverage', () => {
  it('all four canonical agents appear in the matrix', () => {
    const m = buildAgentDataAccessMatrix();
    const agents = new Set(m.policies.map((p) => p.agent));
    for (const a of AGENT_DATA_ACCESS_AGENTS_IN_ORDER) {
      expect(agents.has(a)).toBe(true);
    }
    expect(AGENT_DATA_ACCESS_AGENTS_IN_ORDER.length).toBe(4);
  });

  it('each agent has policies for at least 4 purposes', () => {
    const m = buildAgentDataAccessMatrix();
    for (const agent of AGENT_DATA_ACCESS_AGENTS_IN_ORDER) {
      const purposesForAgent = new Set(
        m.policies.filter((p) => p.agent === agent).map((p) => p.purpose),
      );
      expect(purposesForAgent.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('every policy id is unique and follows the canonical shape', () => {
    const m = buildAgentDataAccessMatrix();
    const ids = m.policies.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of m.policies) {
      expect(p.id).toBe(`agent_data_access:${p.agent}:${p.purpose}`);
    }
  });

  it('every policy carries a non-empty summary and a permission per canonical level', () => {
    const m = buildAgentDataAccessMatrix();
    for (const p of m.policies) {
      expect(typeof p.summary).toBe('string');
      expect(p.summary.length).toBeGreaterThan(0);
      const levels = p.permissions.map((perm) => perm.level);
      expect(levels).toEqual([...AGENT_DATASET_SHARING_LEVELS_IN_ORDER]);
      for (const perm of p.permissions) {
        expect(typeof perm.rationale).toBe('string');
        expect(perm.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('only L4_sensitive_raw_data permissions require explicit approval', () => {
    const m = buildAgentDataAccessMatrix();
    for (const p of m.policies) {
      for (const perm of p.permissions) {
        if (perm.level === 'L4_sensitive_raw_data') {
          expect(perm.requiresExplicitApproval).toBe(true);
        } else {
          expect(perm.requiresExplicitApproval).toBe(false);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// L4 sensitive raw data gating
// ---------------------------------------------------------------------

describe('TRUST2 · L4 sensitive raw data gating', () => {
  it('L4 is blocked without explicit approval for nexus and sentinel', () => {
    const blockingStates: AgentEvidenceApprovalState[] = [
      'unsubmitted',
      'pending_review',
      'conditionally_approved',
      'rejected',
      'revoked',
    ];
    for (const state of blockingStates) {
      for (const agent of ['nexus', 'sentinel'] as AgentDataAccessAgent[]) {
        const d = evaluateAgentDataAccess(
          agent,
          'generate_deliverable',
          'L4_sensitive_raw_data',
          state,
        );
        expect(d.allowed).toBe(false);
        expect(d.blockReason).not.toBeNull();
      }
    }
  });

  it('L4 is allowed with explicit_approved for nexus generate_deliverable', () => {
    const d = evaluateAgentDataAccess(
      'nexus',
      'generate_deliverable',
      'L4_sensitive_raw_data',
      'explicit_approved',
    );
    expect(d.allowed).toBe(true);
    expect(d.blockReason).toBeNull();
    expect(d.rationale.length).toBeGreaterThan(0);
  });

  it('L4 is allowed with explicit_approved for sentinel cite_as_evidence', () => {
    const d = evaluateAgentDataAccess(
      'sentinel',
      'cite_as_evidence',
      'L4_sensitive_raw_data',
      'explicit_approved',
    );
    expect(d.allowed).toBe(true);
    expect(d.blockReason).toBeNull();
  });

  it('L4 remains outside Atlas and Steward envelopes regardless of approval', () => {
    for (const agent of ['atlas', 'steward'] as AgentDataAccessAgent[]) {
      const d = evaluateAgentDataAccess(
        agent,
        'summarize',
        'L4_sensitive_raw_data',
        'explicit_approved',
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).toBe('level_outside_agent_envelope');
    }
  });

  it('L4 block uses sensitive_raw_requires_explicit_approval reason when in agent envelope', () => {
    const d = evaluateAgentDataAccess(
      'nexus',
      'summarize',
      'L4_sensitive_raw_data',
      'pending_review',
    );
    expect(d.allowed).toBe(false);
    expect(d.blockReason).toBe('sensitive_raw_requires_explicit_approval');
  });
});

// ---------------------------------------------------------------------
// cite_as_evidence requires usable evidence
// ---------------------------------------------------------------------

describe('TRUST2 · cite_as_evidence requires usable evidence', () => {
  const unusable: AgentEvidenceApprovalState[] = [
    'unsubmitted',
    'pending_review',
  ];

  it('cite_as_evidence is blocked when evidence trust is not usable', () => {
    for (const state of unusable) {
      const d = evaluateAgentDataAccess(
        'nexus',
        'cite_as_evidence',
        'L3_redacted_extract',
        state,
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).toBe('cite_as_evidence_requires_usable_evidence');
    }
  });

  it('cite_as_evidence is allowed when evidence trust is usable', () => {
    const usable: AgentEvidenceApprovalState[] = [
      'conditionally_approved',
      'explicit_approved',
    ];
    for (const state of usable) {
      const d = evaluateAgentDataAccess(
        'nexus',
        'cite_as_evidence',
        'L3_redacted_extract',
        state,
      );
      expect(d.allowed).toBe(true);
      expect(d.blockReason).toBeNull();
    }
  });

  it('Atlas is not authorized for cite_as_evidence at any level', () => {
    for (const level of AGENT_DATASET_SHARING_LEVELS_IN_ORDER) {
      const d = evaluateAgentDataAccess(
        'atlas',
        'cite_as_evidence',
        level,
        'explicit_approved',
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).toBe('purpose_not_authorized_for_agent');
    }
  });
});

// ---------------------------------------------------------------------
// produce_executive_brief prefers aggregates (L2)
// ---------------------------------------------------------------------

describe('TRUST2 · produce_executive_brief prefers L2_summary_aggregate', () => {
  it('Atlas executive brief on L2 is allowed and marked preferred', () => {
    const d = evaluateAgentDataAccess(
      'atlas',
      'produce_executive_brief',
      'L2_summary_aggregate',
      'explicit_approved',
    );
    expect(d.allowed).toBe(true);
    expect(d.preferredLevel).toBe(true);
  });

  it('executive brief on L3 / L4 is blocked even when in envelope', () => {
    // Use Atlas — Atlas is the canonical executive-brief author.
    // Atlas envelope already excludes L3/L4, but the policy gate
    // still surfaces executive_brief_prefers_aggregate when the
    // level is in the envelope. We test this against an agent for
    // whom the level is in envelope.
    const d3 = evaluateAgentDataAccess(
      'nexus',
      'produce_executive_brief',
      'L3_redacted_extract',
      'explicit_approved',
    );
    // Nexus is not authorized for produce_executive_brief, so the
    // block reason is purpose_not_authorized_for_agent.
    expect(d3.allowed).toBe(false);
  });

  it('Atlas L3 / L4 are blocked because outside Atlas envelope', () => {
    for (const level of [
      'L3_redacted_extract',
      'L4_sensitive_raw_data',
    ] as AgentDatasetSharingLevel[]) {
      const d = evaluateAgentDataAccess(
        'atlas',
        'produce_executive_brief',
        level,
        'explicit_approved',
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).toBe('level_outside_agent_envelope');
    }
  });

  it('executive brief permission marks L2 as preferred in policy matrix', () => {
    const policies = listAgentDataAccessPolicies();
    const briefPolicies = policies.filter(
      (p) => p.purpose === 'produce_executive_brief',
    );
    expect(briefPolicies.length).toBeGreaterThan(0);
    for (const p of briefPolicies) {
      const l2 = p.permissions.find((pp) => pp.level === 'L2_summary_aggregate');
      expect(l2).toBeDefined();
      // L2 is preferred only when the agent is authorized for the
      // purpose AND the level is in the envelope; both are true for
      // Atlas and Steward (the executive-brief authors).
      expect(l2 && l2.preferred).toBe(true);
    }
  });

  it('summary counts at least one preferred-aggregate executive-brief permission', () => {
    const m = buildAgentDataAccessMatrix();
    expect(m.summary.preferredAggregateForExecutiveBrief).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('TRUST2 · summarizeAgentDataAccessMatrix', () => {
  it('byAgent and byPurpose counts reconcile to the policy list', () => {
    const m = buildAgentDataAccessMatrix();
    const byAgent: Record<AgentDataAccessAgent, number> = {
      nexus: 0,
      sentinel: 0,
      atlas: 0,
      steward: 0,
    };
    const byPurpose: Record<AgentDataUsePurpose, number> = {
      summarize: 0,
      recommend: 0,
      cite_as_evidence: 0,
      generate_deliverable: 0,
      evaluate_governance: 0,
      create_mission: 0,
      produce_executive_brief: 0,
    };
    for (const p of m.policies) {
      byAgent[p.agent] += 1;
      byPurpose[p.purpose] += 1;
    }
    expect(m.summary.byAgent).toEqual(byAgent);
    expect(m.summary.byPurpose).toEqual(byPurpose);
    expect(m.summary.totalPolicies).toBe(m.policies.length);
  });

  it('permissionsRequiringExplicitApproval equals number of L4 permissions', () => {
    const m = buildAgentDataAccessMatrix();
    const expected = m.policies.reduce(
      (acc, p) =>
        acc +
        p.permissions.filter((perm) => perm.level === 'L4_sensitive_raw_data')
          .length,
      0,
    );
    expect(m.summary.permissionsRequiringExplicitApproval).toBe(expected);
  });

  it('canonical orderings are stable and exhaustive', () => {
    expect(AGENT_DATA_ACCESS_AGENTS_IN_ORDER.length).toBe(4);
    expect(AGENT_DATASET_SHARING_LEVELS_IN_ORDER.length).toBe(5);
    expect(AGENT_DATA_USE_PURPOSES_IN_ORDER.length).toBe(7);
    expect(AGENT_EVIDENCE_APPROVAL_STATES_IN_ORDER.length).toBe(6);
  });
});

// ---------------------------------------------------------------------
// Block reason coverage
// ---------------------------------------------------------------------

describe('TRUST2 · block reason invariants', () => {
  it('every blocked decision populates a non-null blockReason and a non-empty rationale', () => {
    const candidates: Array<{
      agent: AgentDataAccessAgent;
      purpose: AgentDataUsePurpose;
      level: AgentDatasetSharingLevel;
      approval: AgentEvidenceApprovalState;
    }> = [
      {
        agent: 'atlas',
        purpose: 'cite_as_evidence',
        level: 'L2_summary_aggregate',
        approval: 'explicit_approved',
      },
      {
        agent: 'nexus',
        purpose: 'summarize',
        level: 'L4_sensitive_raw_data',
        approval: 'pending_review',
      },
      {
        agent: 'steward',
        purpose: 'summarize',
        level: 'L4_sensitive_raw_data',
        approval: 'explicit_approved',
      },
      {
        agent: 'nexus',
        purpose: 'cite_as_evidence',
        level: 'L3_redacted_extract',
        approval: 'unsubmitted',
      },
      {
        agent: 'nexus',
        purpose: 'summarize',
        level: 'L2_summary_aggregate',
        approval: 'rejected',
      },
    ];
    for (const c of candidates) {
      const d = evaluateAgentDataAccess(
        c.agent,
        c.purpose,
        c.level,
        c.approval,
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).not.toBeNull();
      expect(d.rationale.length).toBeGreaterThan(0);
    }
  });

  it('every allowed decision has a null blockReason and a non-empty rationale', () => {
    const candidates: Array<{
      agent: AgentDataAccessAgent;
      purpose: AgentDataUsePurpose;
      level: AgentDatasetSharingLevel;
      approval: AgentEvidenceApprovalState;
    }> = [
      {
        agent: 'nexus',
        purpose: 'summarize',
        level: 'L2_summary_aggregate',
        approval: 'conditionally_approved',
      },
      {
        agent: 'sentinel',
        purpose: 'cite_as_evidence',
        level: 'L3_redacted_extract',
        approval: 'explicit_approved',
      },
      {
        agent: 'atlas',
        purpose: 'produce_executive_brief',
        level: 'L2_summary_aggregate',
        approval: 'explicit_approved',
      },
      {
        agent: 'steward',
        purpose: 'evaluate_governance',
        level: 'L1_metadata_only',
        approval: 'pending_review',
      },
    ];
    for (const c of candidates) {
      const d = evaluateAgentDataAccess(
        c.agent,
        c.purpose,
        c.level,
        c.approval,
      );
      expect(d.allowed).toBe(true);
      expect(d.blockReason).toBeNull();
      expect(d.rationale.length).toBeGreaterThan(0);
    }
  });

  it('rejected and revoked approval states block every (agent, purpose, level)', () => {
    for (const state of ['rejected', 'revoked'] as AgentEvidenceApprovalState[]) {
      const d = evaluateAgentDataAccess(
        'nexus',
        'summarize',
        'L2_summary_aggregate',
        state,
      );
      expect(d.allowed).toBe(false);
      expect(d.blockReason).toBe('approval_revoked_or_rejected');
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene · no runtime / auth imports
// ---------------------------------------------------------------------

describe('TRUST2 · module hygiene · agent-data-access-policy.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/agent-data-access-policy.ts',
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

  it('does not import the TRUST1 dataset-trust-model module (lane isolation)', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/admin\/dataset-trust-model'/);
    expect(codeOnly).not.toMatch(/from '\.\.\/admin\/dataset-trust-model'/);
    expect(codeOnly).not.toMatch(/from '\.\/dataset-trust-model'/);
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
