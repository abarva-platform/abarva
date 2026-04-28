// SEC1 - Runtime Safety / Policy Gate Contract tests.
//
// Deterministic, file-pure suite. No model providers, no network, no
// live tool execution. Mirrors TOOL2 / TOOL3 test conventions.

import {
  POLICY_CHECK_KINDS,
  POLICY_DECISIONS,
  POLICY_DENY_REASONS,
  POLICY_REVIEWER_ROLES,
  evaluatePolicyCheck,
  getDenyReasons,
  summarizePolicyChecks,
  type PolicyCheckKind,
  type PolicyCheckRequest,
  type PolicyCheckResult,
  type PolicyDecision,
  type PolicyDenyReason,
  type PolicyReviewerRole,
} from '@/lib/architecture/runtime-policy-gate';

const ALL_KINDS: readonly PolicyCheckKind[] = POLICY_CHECK_KINDS;
const ALL_DECISIONS: readonly PolicyDecision[] = POLICY_DECISIONS;

// ---------------------------------------------------------------------
// Canonical tuples.
// ---------------------------------------------------------------------

describe('SEC1 · canonical tuples', () => {
  it('POLICY_CHECK_KINDS contains the canonical 7 check kinds in canonical order', () => {
    expect(POLICY_CHECK_KINDS).toEqual([
      'tenant_scope',
      'tool_use',
      'model_gateway_use',
      'evidence_use',
      'dataset_trust',
      'export_download',
      'agent_handoff',
    ]);
  });

  it('POLICY_DECISIONS contains the canonical 4 decisions in canonical order', () => {
    expect(POLICY_DECISIONS).toEqual([
      'allow',
      'deny',
      'require_waiver',
      'require_review',
    ]);
  });

  it('POLICY_DENY_REASONS is a non-empty closed set', () => {
    expect(POLICY_DENY_REASONS.length).toBeGreaterThanOrEqual(7);
    expect(new Set(POLICY_DENY_REASONS).size).toBe(POLICY_DENY_REASONS.length);
  });

  it('POLICY_REVIEWER_ROLES is a non-empty closed set', () => {
    expect(POLICY_REVIEWER_ROLES.length).toBeGreaterThanOrEqual(2);
    expect(new Set(POLICY_REVIEWER_ROLES).size).toBe(POLICY_REVIEWER_ROLES.length);
  });
});

// ---------------------------------------------------------------------
// Per-kind coverage: every kind produces every applicable decision.
// ---------------------------------------------------------------------

describe('SEC1 · all 7 check kinds produce a result with canonical fields', () => {
  function baseRequest(kind: PolicyCheckKind): PolicyCheckRequest {
    return {
      kind,
      actor: 'steward',
      tenantKey: 'acme',
      subjectId: `subject.${kind}.v1`,
    };
  }

  it.each(ALL_KINDS)('kind=%s returns a PolicyCheckResult with canonical createdFrom and policyBasis', (kind) => {
    const result = evaluatePolicyCheck(baseRequest(kind));
    expect(result.kind).toBe(kind);
    expect(result.createdFrom).toBe('deterministic_runtime_policy_gate_seed');
    expect(result.policyBasis).toMatch(/^runtime_policy_gate\.v1\./);
    expect(result.rationale.trim().length).toBeGreaterThan(0);
    expect(POLICY_DECISIONS).toContain(result.decision);
  });
});

// ---------------------------------------------------------------------
// All 4 decisions appear across the surface.
// ---------------------------------------------------------------------

describe('SEC1 · all 4 decisions are reachable', () => {
  it('allow is produced (e.g. tenant_scope with matching tenantKey)', () => {
    const result = evaluatePolicyCheck({
      kind: 'tenant_scope',
      actor: 'steward',
      tenantKey: 'acme',
      subjectId: 'tool.read_program_state.v1',
      subjectTenantKey: 'acme',
    });
    expect(result.decision).toBe('allow');
  });

  it('deny is produced (e.g. tenant_scope mismatch)', () => {
    const result = evaluatePolicyCheck({
      kind: 'tenant_scope',
      actor: 'atlas',
      tenantKey: 'acme',
      subjectId: 'artifact.brief.v1',
      subjectTenantKey: 'meridian',
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('tenant_scope_mismatch');
  });

  it('require_waiver is produced (e.g. export without explicit approval)', () => {
    const result = evaluatePolicyCheck({
      kind: 'export_download',
      actor: 'atlas',
      tenantKey: 'acme',
      subjectId: 'export.board_pack.v1',
      approvalState: 'none',
    });
    expect(result.decision).toBe('require_waiver');
    expect(result.reviewerRole).toBe('governance_reviewer');
  });

  it('require_review is produced (e.g. model_gateway_use when not live)', () => {
    const result = evaluatePolicyCheck({
      kind: 'model_gateway_use',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'model.gpt-4o-mini.v1',
      modelGatewayLive: false,
    });
    expect(result.decision).toBe('require_review');
    expect(result.reviewerRole).toBe('steward');
  });
});

// ---------------------------------------------------------------------
// tenant_scope mismatch -> deny.
// ---------------------------------------------------------------------

describe('SEC1 · tenant_scope mismatch -> deny', () => {
  it('refuses when subjectTenantKey differs from tenantKey', () => {
    const result = evaluatePolicyCheck({
      kind: 'tenant_scope',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'tool.read_program_state.v1',
      subjectTenantKey: 'meridian',
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('tenant_scope_mismatch');
    expect(result.rationale.toLowerCase()).toContain('mismatch');
  });

  it('refuses when tenantKey is empty', () => {
    const result = evaluatePolicyCheck({
      kind: 'tenant_scope',
      actor: 'nexus',
      tenantKey: '',
      subjectId: 'tool.read_program_state.v1',
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('tenant_scope_mismatch');
  });

  it('allows when subject is platform-scoped even if tenant differs', () => {
    const result = evaluatePolicyCheck({
      kind: 'tenant_scope',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'tool.get_solution_archetype.v1',
      subjectTenantKey: 'platform',
    });
    expect(result.decision).toBe('allow');
  });
});

// ---------------------------------------------------------------------
// export_download without approval -> require_waiver.
// ---------------------------------------------------------------------

describe('SEC1 · export_download without approval -> require_waiver', () => {
  it.each(['none', 'pending', 'revoked', 'expired'] as const)(
    'approvalState=%s requires waiver',
    (approvalState) => {
      const result = evaluatePolicyCheck({
        kind: 'export_download',
        actor: 'atlas',
        tenantKey: 'meridian',
        subjectId: 'export.executive_brief.v1',
        approvalState,
      });
      expect(result.decision).toBe('require_waiver');
      expect(result.reviewerRole).toBe('governance_reviewer');
      expect(result.denyReason).toBe('export_requires_approval');
    },
  );

  it('allows when approvalState is explicit_approved', () => {
    const result = evaluatePolicyCheck({
      kind: 'export_download',
      actor: 'atlas',
      tenantKey: 'meridian',
      subjectId: 'export.executive_brief.v1',
      approvalState: 'explicit_approved',
    });
    expect(result.decision).toBe('allow');
    expect(result.denyReason).toBeUndefined();
  });
});

// ---------------------------------------------------------------------
// tool_use behavior.
// ---------------------------------------------------------------------

describe('SEC1 · tool_use', () => {
  it('denies when tool is not registered', () => {
    const result = evaluatePolicyCheck({
      kind: 'tool_use',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'tool.unknown.v1',
      toolRegistered: false,
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('tool_not_registered');
  });

  it('denies when actor is not allowed for the tool', () => {
    const result = evaluatePolicyCheck({
      kind: 'tool_use',
      actor: 'admin',
      tenantKey: 'acme',
      subjectId: 'tool.update_gate_status.v1',
      toolRegistered: true,
      toolActorAllowed: false,
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('tool_forbidden_for_actor');
  });

  it('allows when registered and actor permitted', () => {
    const result = evaluatePolicyCheck({
      kind: 'tool_use',
      actor: 'steward',
      tenantKey: 'acme',
      subjectId: 'tool.update_gate_status.v1',
      toolRegistered: true,
      toolActorAllowed: true,
    });
    expect(result.decision).toBe('allow');
  });
});

// ---------------------------------------------------------------------
// evidence_use behavior.
// ---------------------------------------------------------------------

describe('SEC1 · evidence_use', () => {
  it('denies unusable evidence', () => {
    const result = evaluatePolicyCheck({
      kind: 'evidence_use',
      actor: 'sentinel',
      tenantKey: 'acme',
      subjectId: 'evidence-seed-99',
      evidenceTrust: 'unusable',
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('evidence_unusable');
  });

  it('requires review for unknown trust', () => {
    const result = evaluatePolicyCheck({
      kind: 'evidence_use',
      actor: 'sentinel',
      tenantKey: 'acme',
      subjectId: 'evidence-seed-100',
      evidenceTrust: 'unknown',
    });
    expect(result.decision).toBe('require_review');
    expect(result.reviewerRole).toBe('steward');
  });

  it('allows usable evidence', () => {
    const result = evaluatePolicyCheck({
      kind: 'evidence_use',
      actor: 'atlas',
      tenantKey: 'acme',
      subjectId: 'evidence-seed-1',
      evidenceTrust: 'usable',
    });
    expect(result.decision).toBe('allow');
  });
});

// ---------------------------------------------------------------------
// dataset_trust behavior.
// ---------------------------------------------------------------------

describe('SEC1 · dataset_trust', () => {
  it('denies L4 sensitive without explicit_approved', () => {
    const result = evaluatePolicyCheck({
      kind: 'dataset_trust',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'dataset.customer_pii.v1',
      datasetSharingLevel: 'L4',
      approvalState: 'pending',
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('dataset_trust_insufficient');
  });

  it('allows L4 sensitive with explicit_approved', () => {
    const result = evaluatePolicyCheck({
      kind: 'dataset_trust',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'dataset.customer_pii.v1',
      datasetSharingLevel: 'L4',
      approvalState: 'explicit_approved',
    });
    expect(result.decision).toBe('allow');
  });

  it('requires waiver for L3 without explicit_approved', () => {
    const result = evaluatePolicyCheck({
      kind: 'dataset_trust',
      actor: 'sentinel',
      tenantKey: 'acme',
      subjectId: 'dataset.contracts.v1',
      datasetSharingLevel: 'L3',
      approvalState: 'pending',
    });
    expect(result.decision).toBe('require_waiver');
    expect(result.reviewerRole).toBe('tenant_admin');
  });

  it('denies revoked or expired approvals at any level', () => {
    const revoked = evaluatePolicyCheck({
      kind: 'dataset_trust',
      actor: 'sentinel',
      tenantKey: 'acme',
      subjectId: 'dataset.contracts.v1',
      datasetSharingLevel: 'L2',
      approvalState: 'revoked',
    });
    expect(revoked.decision).toBe('deny');
    expect(revoked.denyReason).toBe('dataset_trust_insufficient');

    const expired = evaluatePolicyCheck({
      kind: 'dataset_trust',
      actor: 'sentinel',
      tenantKey: 'acme',
      subjectId: 'dataset.contracts.v1',
      datasetSharingLevel: 'L2',
      approvalState: 'expired',
    });
    expect(expired.decision).toBe('deny');
  });
});

// ---------------------------------------------------------------------
// agent_handoff behavior.
// ---------------------------------------------------------------------

describe('SEC1 · agent_handoff', () => {
  it('denies when handoff is not authorized', () => {
    const result = evaluatePolicyCheck({
      kind: 'agent_handoff',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'handoff.nexus_to_atlas.v1',
      handoffAuthorized: false,
    });
    expect(result.decision).toBe('deny');
    expect(result.denyReason).toBe('agent_handoff_unauthorized');
  });

  it('requires review when authorization is unknown', () => {
    const result = evaluatePolicyCheck({
      kind: 'agent_handoff',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'handoff.nexus_to_atlas.v2',
    });
    expect(result.decision).toBe('require_review');
    expect(result.reviewerRole).toBe('steward');
  });

  it('allows when authorized', () => {
    const result = evaluatePolicyCheck({
      kind: 'agent_handoff',
      actor: 'nexus',
      tenantKey: 'acme',
      subjectId: 'handoff.nexus_to_atlas.v3',
      handoffAuthorized: true,
    });
    expect(result.decision).toBe('allow');
  });
});

// ---------------------------------------------------------------------
// Byte-equal determinism.
// ---------------------------------------------------------------------

describe('SEC1 · determinism', () => {
  function fixedRequests(): readonly PolicyCheckRequest[] {
    return [
      { kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's1', subjectTenantKey: 'acme' },
      { kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's2', subjectTenantKey: 'meridian' },
      { kind: 'tool_use', actor: 'steward', tenantKey: 'acme', subjectId: 'tool.update_gate_status.v1', toolRegistered: true, toolActorAllowed: true },
      { kind: 'tool_use', actor: 'admin', tenantKey: 'acme', subjectId: 'tool.update_gate_status.v1', toolRegistered: true, toolActorAllowed: false },
      { kind: 'model_gateway_use', actor: 'nexus', tenantKey: 'acme', subjectId: 'model.gpt-4o-mini.v1', modelGatewayLive: false },
      { kind: 'model_gateway_use', actor: 'nexus', tenantKey: 'acme', subjectId: 'model.gpt-4o-mini.v1', modelGatewayLive: true },
      { kind: 'evidence_use', actor: 'sentinel', tenantKey: 'acme', subjectId: 'evidence-seed-1', evidenceTrust: 'usable' },
      { kind: 'evidence_use', actor: 'sentinel', tenantKey: 'acme', subjectId: 'evidence-seed-2', evidenceTrust: 'unusable' },
      { kind: 'evidence_use', actor: 'sentinel', tenantKey: 'acme', subjectId: 'evidence-seed-3', evidenceTrust: 'unknown' },
      { kind: 'dataset_trust', actor: 'nexus', tenantKey: 'acme', subjectId: 'dataset.l4.v1', datasetSharingLevel: 'L4', approvalState: 'pending' },
      { kind: 'dataset_trust', actor: 'nexus', tenantKey: 'acme', subjectId: 'dataset.l4.v1', datasetSharingLevel: 'L4', approvalState: 'explicit_approved' },
      { kind: 'dataset_trust', actor: 'nexus', tenantKey: 'acme', subjectId: 'dataset.l3.v1', datasetSharingLevel: 'L3', approvalState: 'pending' },
      { kind: 'export_download', actor: 'atlas', tenantKey: 'acme', subjectId: 'export.board.v1', approvalState: 'none' },
      { kind: 'export_download', actor: 'atlas', tenantKey: 'acme', subjectId: 'export.board.v1', approvalState: 'explicit_approved' },
      { kind: 'agent_handoff', actor: 'nexus', tenantKey: 'acme', subjectId: 'handoff.x.v1', handoffAuthorized: true },
      { kind: 'agent_handoff', actor: 'nexus', tenantKey: 'acme', subjectId: 'handoff.x.v2', handoffAuthorized: false },
    ];
  }

  it('returns byte-equal JSON for repeated calls with identical inputs', () => {
    const reqs = fixedRequests();
    const first = JSON.stringify(reqs.map((r) => evaluatePolicyCheck(r)));
    const second = JSON.stringify(reqs.map((r) => evaluatePolicyCheck(r)));
    const third = JSON.stringify(reqs.map((r) => evaluatePolicyCheck(r)));
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('every emitted result carries createdFrom: deterministic_runtime_policy_gate_seed', () => {
    for (const req of fixedRequests()) {
      const result = evaluatePolicyCheck(req);
      expect(result.createdFrom).toBe('deterministic_runtime_policy_gate_seed');
    }
  });

  it('every emitted result carries a non-empty rationale and policyBasis', () => {
    for (const req of fixedRequests()) {
      const result = evaluatePolicyCheck(req);
      expect(result.rationale.trim().length).toBeGreaterThan(0);
      expect(result.policyBasis.trim().length).toBeGreaterThan(0);
      expect(result.policyBasis).toMatch(/^runtime_policy_gate\.v1\./);
    }
  });
});

// ---------------------------------------------------------------------
// summarizePolicyChecks + getDenyReasons.
// ---------------------------------------------------------------------

describe('SEC1 · summarizePolicyChecks', () => {
  function sampleResults(): readonly PolicyCheckResult[] {
    return [
      evaluatePolicyCheck({ kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's1', subjectTenantKey: 'acme' }),
      evaluatePolicyCheck({ kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's2', subjectTenantKey: 'meridian' }),
      evaluatePolicyCheck({ kind: 'export_download', actor: 'atlas', tenantKey: 'acme', subjectId: 'e1', approvalState: 'none' }),
      evaluatePolicyCheck({ kind: 'model_gateway_use', actor: 'nexus', tenantKey: 'acme', subjectId: 'm1', modelGatewayLive: false }),
    ];
  }

  it('totals reconcile with input length', () => {
    const results = sampleResults();
    const summary = summarizePolicyChecks(results);
    expect(summary.totalChecks).toBe(results.length);

    const decisionTotal = ALL_DECISIONS.reduce((acc, d) => acc + summary.byDecision[d], 0);
    const kindTotal = ALL_KINDS.reduce((acc, k) => acc + summary.byKind[k], 0);
    expect(decisionTotal).toBe(results.length);
    expect(kindTotal).toBe(results.length);
  });

  it('counters reconcile with byDecision', () => {
    const summary = summarizePolicyChecks(sampleResults());
    expect(summary.allowCount).toBe(summary.byDecision.allow);
    expect(summary.denyCount).toBe(summary.byDecision.deny);
    expect(summary.waiverCount).toBe(summary.byDecision.require_waiver);
    expect(summary.reviewCount).toBe(summary.byDecision.require_review);
  });

  it('returns a zero-counted summary on an empty input list', () => {
    const summary = summarizePolicyChecks([]);
    expect(summary.totalChecks).toBe(0);
    expect(summary.allowCount).toBe(0);
    expect(summary.denyCount).toBe(0);
    expect(summary.waiverCount).toBe(0);
    expect(summary.reviewCount).toBe(0);
    for (const decision of ALL_DECISIONS) {
      expect(summary.byDecision[decision]).toBe(0);
    }
    for (const kind of ALL_KINDS) {
      expect(summary.byKind[kind]).toBe(0);
    }
  });
});

describe('SEC1 · getDenyReasons', () => {
  it('returns only deny-decision reasons, in input order', () => {
    const results: readonly PolicyCheckResult[] = [
      evaluatePolicyCheck({ kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's1', subjectTenantKey: 'acme' }),
      evaluatePolicyCheck({ kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's2', subjectTenantKey: 'meridian' }),
      evaluatePolicyCheck({ kind: 'evidence_use', actor: 'atlas', tenantKey: 'acme', subjectId: 'evi1', evidenceTrust: 'unusable' }),
    ];
    const reasons: readonly PolicyDenyReason[] = getDenyReasons(results);
    expect(reasons).toEqual(['tenant_scope_mismatch', 'evidence_unusable']);
  });

  it('returns an empty list when nothing is denied', () => {
    const results: readonly PolicyCheckResult[] = [
      evaluatePolicyCheck({ kind: 'tenant_scope', actor: 'nexus', tenantKey: 'acme', subjectId: 's1', subjectTenantKey: 'acme' }),
    ];
    expect(getDenyReasons(results)).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Reviewer-role coverage.
// ---------------------------------------------------------------------

describe('SEC1 · reviewerRole closed set', () => {
  it('every reviewerRole emitted is from POLICY_REVIEWER_ROLES', () => {
    const allRoles: readonly PolicyReviewerRole[] = POLICY_REVIEWER_ROLES;
    const probes: readonly PolicyCheckResult[] = [
      evaluatePolicyCheck({ kind: 'model_gateway_use', actor: 'nexus', tenantKey: 'acme', subjectId: 'm1', modelGatewayLive: false }),
      evaluatePolicyCheck({ kind: 'export_download', actor: 'atlas', tenantKey: 'acme', subjectId: 'e1', approvalState: 'none' }),
      evaluatePolicyCheck({ kind: 'dataset_trust', actor: 'nexus', tenantKey: 'acme', subjectId: 'd1', datasetSharingLevel: 'L3', approvalState: 'pending' }),
      evaluatePolicyCheck({ kind: 'agent_handoff', actor: 'nexus', tenantKey: 'acme', subjectId: 'h1' }),
    ];
    for (const result of probes) {
      if (result.reviewerRole !== undefined) {
        expect(allRoles).toContain(result.reviewerRole);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene + no-execution evidence.
// ---------------------------------------------------------------------

describe('module hygiene · runtime-policy-gate.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/runtime-policy-gate.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent / Source / Auth runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not actually execute any tool: no await, no shell, no fs writes', () => {
    expect(codeOnly).not.toMatch(/\bawait\b/);
    expect(codeOnly).not.toMatch(/writeFile/);
    expect(codeOnly).not.toMatch(/appendFile/);
    expect(codeOnly).not.toMatch(/createWriteStream/);
    expect(codeOnly).not.toMatch(/child_process/);
    expect(codeOnly).not.toMatch(/\bspawn\(/);
    expect(codeOnly).not.toMatch(/\bexec\(/);
    expect(codeOnly).not.toMatch(/execSync/);
  });
});
