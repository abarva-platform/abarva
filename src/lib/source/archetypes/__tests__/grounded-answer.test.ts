// Governed-reasoning proof (P0 fix): a Source answer is only as confident as its
// agent-ready, tenant-scoped, governed evidence. No hardcoded 'high'. Cross-
// tenant data is fenced. Committed-but-not-promoted evidence does NOT ground an
// answer. Missing evidence is always named. Zero agent-ready evidence → refuse.

import { AMS_MANAGED_SERVICES } from '../registry';
import {
  buildGroundedSourceAnswer,
  isCleanGroundedAnswer,
  type SourceEvidenceCandidate,
} from '../grounded-answer';

const TENANT = 'skyharbor-air';

function agentReady(familyKey: string, id: string, client = TENANT): SourceEvidenceCandidate {
  return {
    id,
    client_key: client,
    tenant_id: 'tenant-sky',
    source_layer: 'uploaded_evidence',
    source_basis: `${familyKey} export`,
    classification: 'confidential',
    retrievability: 'search_indexed',
    agent_readiness_status: 'agent_ready',
    confidence_level: 'high',
    cited_render_verified_at: '2026-06-10T00:00:00Z',
    citations: [`ev:${familyKey}#${id}`],
    familyKey,
  };
}

function committedNotPromoted(familyKey: string, id: string): SourceEvidenceCandidate {
  return {
    ...agentReady(familyKey, id),
    agent_readiness_status: 'committed_not_indexed',
    retrievability: 'committed_not_indexed',
    cited_render_verified_at: null,
  };
}

const REQUIRED = AMS_MANAGED_SERVICES.requiredEvidenceFamilies.map((f) => f.key);

describe('governed Source reasoning — confidence is derived, never hardcoded', () => {
  it('returns high confidence only when ALL required families are agent-ready', () => {
    const candidates = REQUIRED.map((f, i) => agentReady(f, `c${i}`));
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates });
    expect(ans.envelope.confidence).toBe('high');
    expect(ans.envelope.missingEvidence).toEqual([]);
    expect(ans.mayAnswer).toBe(true);
    expect(isCleanGroundedAnswer(ans)).toBe(true);
  });

  it('returns medium/low when only some required families are agent-ready', () => {
    const half = REQUIRED.slice(0, Math.ceil(REQUIRED.length / 2)).map((f, i) => agentReady(f, `c${i}`));
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates: half });
    expect(['medium', 'low']).toContain(ans.envelope.confidence);
    expect(ans.envelope.missingEvidence.length).toBeGreaterThan(0);
  });

  it('REFUSES with insufficient_evidence when nothing is agent-ready', () => {
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates: [] });
    expect(ans.envelope.confidence).toBe('insufficient_evidence');
    expect(ans.mayAnswer).toBe(false);
    expect(ans.refusalReason).toMatch(/Refusing/);
    expect(ans.envelope.missingEvidence).toEqual(expect.arrayContaining(REQUIRED));
  });
});

describe('governed Source reasoning — promotion-only & tenant fence', () => {
  it('does NOT let committed-but-not-promoted evidence ground an answer', () => {
    const candidates = [
      agentReady('run_cost_baseline', 'a'),
      committedNotPromoted('ticket_volumes', 'b'), // present but not promoted
    ];
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates });
    expect(ans.envelope.evidenceUsed).toContain('run_cost_baseline');
    expect(ans.envelope.evidenceUsed).not.toContain('ticket_volumes');
    expect(ans.envelope.missingEvidence).toContain('ticket_volumes');
    // the blocked candidate's citation must NOT appear
    expect(ans.envelope.citations).not.toContain('ev:ticket_volumes#b');
  });

  it('fences cross-tenant candidates — they never inform the answer', () => {
    const candidates = [
      agentReady('run_cost_baseline', 'mine'),
      agentReady('ticket_volumes', 'leak', 'apex-retail'), // different tenant
    ];
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates });
    expect(ans.envelope.evidenceUsed).toContain('run_cost_baseline');
    expect(ans.envelope.evidenceUsed).not.toContain('ticket_volumes');
    expect(ans.envelope.citations).not.toContain('ev:ticket_volumes#leak');
  });

  it('refuses and reports the fence when the ONLY agent-ready evidence is cross-tenant', () => {
    const candidates = [
      agentReady('run_cost_baseline', 'leak1', 'apex-retail'),
      agentReady('ticket_volumes', 'leak2', 'apex-retail'),
    ];
    const ans = buildGroundedSourceAnswer({ archetype: AMS_MANAGED_SERVICES, tenantKey: TENANT, candidates });
    expect(ans.mayAnswer).toBe(false);
    expect(ans.envelope.evidenceUsed).toEqual([]);
    expect(ans.refusalReason ?? '').toMatch(/cross-tenant/);
  });
});

describe('governed Source reasoning — unsupported claims block a clean answer', () => {
  it('flags claims with no backing citation and fails the clean check', () => {
    const candidates = REQUIRED.map((f, i) => agentReady(f, `c${i}`));
    const ans = buildGroundedSourceAnswer({
      archetype: AMS_MANAGED_SERVICES,
      tenantKey: TENANT,
      candidates,
      draftClaims: [
        { text: 'Run cost is $5.4M', backedByCitation: 'ev:run_cost_baseline#c0' },
        { text: 'We will save 40%' }, // no citation → unsupported
      ],
    });
    expect(ans.envelope.unsupportedClaims).toContain('We will save 40%');
    expect(isCleanGroundedAnswer(ans)).toBe(false);
  });
});
