import {
  avaCitationsFromGovernedCandidates,
  factConfidenceToConfidenceLevel,
  governedCandidateFromVendorLeverFact,
} from '@/lib/source/ava/vendor-coverage-governed-answer';
import { buildValidatedAgentContextBundle } from '@/lib/governance/agent-context-bundle';
import type { VendorLeverResponseFact } from '@/lib/source/facts/event-facts-reader';

function fact(
  overrides: Partial<VendorLeverResponseFact> = {},
): VendorLeverResponseFact {
  return {
    id: 'fact-1',
    vendorId: 'vendor-a',
    leverKey: 'AMS.VOLUME_BAND_PRICING',
    status: 'addressed',
    sourceCitation: { doc: 'vendor-a-proposal.pdf', locator: 'p.12' },
    confidence: 'high',
    capturedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('factConfidenceToConfidenceLevel', () => {
  it('maps every FactConfidence value to its ConfidenceLevel counterpart (not a 1:1 string cast)', () => {
    expect(factConfidenceToConfidenceLevel('low')).toBe('low');
    expect(factConfidenceToConfidenceLevel('med')).toBe('medium');
    expect(factConfidenceToConfidenceLevel('high')).toBe('high');
  });
});

describe('governedCandidateFromVendorLeverFact', () => {
  it('maps a real fact row to an honest GovernedCandidate — never fabricating readiness or retrievability', () => {
    const candidate = governedCandidateFromVendorLeverFact(fact(), {
      clientKey: 'apex-retail',
      tenantId: 'tenant-123',
    });

    expect(candidate.id).toBe('fact-1');
    expect(candidate.client_key).toBe('apex-retail');
    expect(candidate.tenant_id).toBe('tenant-123');
    expect(candidate.source_layer).toBe('vendor');
    expect(candidate.source_basis).toBe('vendor-a-proposal.pdf');
    expect(candidate.classification).toBe('confidential');
    // The always-honest fields: source_event_facts is never indexed or
    // promoted anywhere today, so these must never be anything but this.
    expect(candidate.retrievability).toBe('not_indexed');
    expect(candidate.agent_readiness_status).toBe('not_reviewed');
    expect(candidate.cited_render_verified_at).toBeNull();
    expect(candidate.confidence_level).toBe('high');
    expect(candidate.citations).toEqual(['vendor-a-proposal.pdf — p.12']);
  });

  it('carries a null source_basis and empty citations when the fact has no citation', () => {
    const candidate = governedCandidateFromVendorLeverFact(
      fact({ sourceCitation: null, confidence: 'med' }),
      { clientKey: 'apex-retail', tenantId: null },
    );

    expect(candidate.source_basis).toBeNull();
    expect(candidate.tenant_id).toBeNull();
    expect(candidate.citations).toEqual([]);
    expect(candidate.confidence_level).toBe('medium');
  });
});

describe('avaCitationsFromGovernedCandidates', () => {
  it('builds real AnswerCitation[] from usable candidates, not the flattened citations list', () => {
    const candidate = governedCandidateFromVendorLeverFact(fact(), {
      clientKey: 'apex-retail',
      tenantId: 'tenant-123',
    });

    const citations = avaCitationsFromGovernedCandidates([candidate]);

    expect(citations).toHaveLength(1);
    expect(citations[0].sourceClass).toBe('tenant-fact');
    expect(citations[0].recordId).toBe('fact-1');
    expect(citations[0].excerpt).toBe('vendor-a-proposal.pdf — p.12');
    expect(citations[0].confidence).toBe('high');
  });

  it('caps at 8 citations', () => {
    const candidates = Array.from({ length: 12 }, (_, i) =>
      governedCandidateFromVendorLeverFact(fact({ id: `fact-${i}` }), {
        clientKey: 'apex-retail',
        tenantId: 'tenant-123',
      }),
    );

    expect(avaCitationsFromGovernedCandidates(candidates)).toHaveLength(8);
  });
});

describe('buildValidatedAgentContextBundle over mapped candidates (the real gate, requireAgentReady: false)', () => {
  it('marks honestly-mapped, never-indexed candidates usable when requireAgentReady is false', () => {
    const candidate = governedCandidateFromVendorLeverFact(fact(), {
      clientKey: 'apex-retail',
      tenantId: 'tenant-123',
    });

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: false,
    });

    expect(bundle.decision).not.toBe('block');
    expect(bundle.usable).toHaveLength(1);
    // The known, deliberate limitation: this evidence class can never be
    // agent_ready under the current retrievability model.
    expect(bundle.agentReadyCount).toBe(0);
  });

  it('blocks the same candidates when requireAgentReady is true — proving the false default is load-bearing, not cosmetic', () => {
    const candidate = governedCandidateFromVendorLeverFact(fact(), {
      clientKey: 'apex-retail',
      tenantId: 'tenant-123',
    });

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: true,
    });

    expect(bundle.decision).toBe('block');
    expect(bundle.usable).toHaveLength(0);
  });

  it('never marks a sensitive classification usable even with requireAgentReady: false (never silently degrades)', () => {
    const candidate = {
      ...governedCandidateFromVendorLeverFact(fact(), {
        clientKey: 'apex-retail',
        tenantId: 'tenant-123',
      }),
      classification: 'restricted' as const,
    };

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: false,
    });

    expect(bundle.decision).toBe('block');
    expect(bundle.usable).toHaveLength(0);
    expect(bundle.blocked).toHaveLength(1);
  });
});
