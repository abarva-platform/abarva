import {
  avaCitationsFromGovernedCandidates,
  buildVendorCoverageGovernedAnswer,
  factConfidenceToConfidenceLevel,
  governedClientKeyForSourceClientKey,
  governedCandidateFromVendorLeverFact,
} from '@/lib/source/ava/vendor-coverage-governed-answer';
import { buildValidatedAgentContextBundle } from '@/lib/governance/agent-context-bundle';
import {
  readEventFacts,
  readVendorLeverResponseFacts,
  readVendorLeverResponses,
} from '@/lib/source/facts/event-facts-reader';
import type {
  ResponseStatus,
  VendorLeverResponseFact,
} from '@/lib/source/facts/event-facts-reader';

jest.mock('@/lib/source/facts/event-facts-reader', () => ({
  readEventFacts: jest.fn(),
  readVendorLeverResponseFacts: jest.fn(),
  readVendorLeverResponses: jest.fn(),
}));

const mockReadEventFacts = jest.mocked(readEventFacts);
const mockReadVendorLeverResponses = jest.mocked(readVendorLeverResponses);
const mockReadVendorLeverResponseFacts = jest.mocked(
  readVendorLeverResponseFacts,
);

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

describe('governedClientKeyForSourceClientKey', () => {
  it('maps legacy Source data-plane client keys to canonical governance tenant keys', () => {
    expect(governedClientKeyForSourceClientKey('meridian')).toBe(
      'meridian-health',
    );
    expect(governedClientKeyForSourceClientKey('apexretail')).toBe(
      'apex-retail',
    );
    expect(governedClientKeyForSourceClientKey('first-capital')).toBe(
      'first-capital',
    );
  });

  it('fails closed for unknown client keys before building governed candidates', () => {
    expect(governedClientKeyForSourceClientKey('unknown-client')).toBeNull();
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

describe('buildVendorCoverageGovernedAnswer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('prefers visible response-stage profile vendors for unsupported-claim questions', async () => {
    const answer = await buildVendorCoverageGovernedAnswer({
      eventId: 'fa4d9a8f-85ab-4245-9b9b-2906710dd22e',
      clientKey: 'skyharbor',
      tenantId: 'tenant-skyharbor',
      question: 'Which vendor claims are unsupported or lack evidence?',
      eventType: 'infrastructure',
      event: {
        id: 'fa4d9a8f-85ab-4245-9b9b-2906710dd22e',
        code: 'SKYH-SKYHARBOR-AMS-OUTSOURCING-2026',
        name: 'SkyHarbor Global Application Managed Services (AMS) Sourcing Event',
        accountName: 'SkyHarbor Air',
      },
    });

    expect(readEventFacts).not.toHaveBeenCalled();
    expect(readVendorLeverResponses).not.toHaveBeenCalled();
    expect(readVendorLeverResponseFacts).not.toHaveBeenCalled();
    expect(answer).not.toBeNull();
    const table = answer!.artifacts.find(
      (artifact) => artifact.artifact === 'table',
    );
    expect(table?.rows.map((row) => row.vendor)).toEqual([
      'Vendor A — incumbent operations profile',
      'Vendor B — scale transformation profile',
      'Vendor C — specialist service profile',
    ]);
    expect(JSON.stringify(answer)).not.toContain('Amadeus');
    expect(answer!.caveats?.[0]?.detail).toMatch(/Vendor A\/B\/C/);
  });

  it('reads Source facts with the legacy client key but emits a canonical governed answer', async () => {
    mockReadEventFacts.mockResolvedValue({ inputs: {}, citations: {} });
    mockReadVendorLeverResponses.mockResolvedValue({
      signalPresent: true,
      vendors: ['Vendor Alpha'],
      statusByVendorLever: new Map([
        [
          'Vendor Alpha',
          new Map([
            ['AMS.VOLUME_BAND_PRICING', 'addressed'],
            ['AMS.ENHANCEMENT_LEAKAGE', 'partial'],
          ]),
        ],
      ]),
    });
    mockReadVendorLeverResponseFacts.mockResolvedValue([
      fact({
        id: 'fact-alpha-volume',
        vendorId: 'Vendor Alpha',
        leverKey: 'AMS.VOLUME_BAND_PRICING',
        sourceCitation: {
          doc: 'RESPONSE_COVERAGE_V1',
          locator: "row 2",
        },
      }),
    ]);

    const answer = await buildVendorCoverageGovernedAnswer({
      eventId: 'event-1',
      clientKey: 'meridian',
      tenantId: 'tenant-meridian',
      question: 'How are vendors doing on response coverage?',
      eventType: 'infrastructure',
    });

    expect(readEventFacts).toHaveBeenCalledWith({
      eventId: 'event-1',
      clientKey: 'meridian',
    });
    expect(readVendorLeverResponses).toHaveBeenCalledWith({
      eventId: 'event-1',
      clientKey: 'meridian',
    });
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe('meridian-health');
    expect(answer!.status).toBe('answered');
    expect(answer!.artifacts[0]?.artifact).toBe('table');
    expect(answer!.citations[0]?.recordId).toBe('fact-alpha-volume');
  });

  it('answers unsupported-claim questions only from event response vendors, never ambient vendor names', async () => {
    const statusByVendorLever = new Map<
      string,
      Map<string, ResponseStatus>
    >([
      [
        'Vendor A',
        new Map<string, ResponseStatus>([
          ['AMS.VOLUME_BAND_PRICING', 'addressed'],
          ['AMS.ENHANCEMENT_LEAKAGE', 'partial'],
        ]),
      ],
      [
        'Vendor B',
        new Map<string, ResponseStatus>([
          ['AMS.VOLUME_BAND_PRICING', 'dodged'],
          ['AMS.ENHANCEMENT_LEAKAGE', 'partial'],
        ]),
      ],
      [
        'Vendor C',
        new Map<string, ResponseStatus>([
          ['AMS.VOLUME_BAND_PRICING', 'addressed'],
          ['AMS.ENHANCEMENT_LEAKAGE', 'dodged'],
        ]),
      ],
    ]);
    mockReadEventFacts.mockResolvedValue({ inputs: {}, citations: {} });
    mockReadVendorLeverResponses.mockResolvedValue({
      signalPresent: true,
      vendors: ['Vendor A', 'Vendor B', 'Vendor C'],
      statusByVendorLever,
    });
    mockReadVendorLeverResponseFacts.mockResolvedValue([
      fact({
        id: 'fact-vendor-a-volume',
        vendorId: 'Vendor A',
        leverKey: 'AMS.VOLUME_BAND_PRICING',
        status: 'addressed',
      }),
      fact({
        id: 'fact-vendor-b-volume',
        vendorId: 'Vendor B',
        leverKey: 'AMS.VOLUME_BAND_PRICING',
        status: 'dodged',
      }),
      fact({
        id: 'fact-vendor-c-leakage',
        vendorId: 'Vendor C',
        leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
        status: 'dodged',
      }),
    ]);

    const answer = await buildVendorCoverageGovernedAnswer({
      eventId: 'event-1',
      clientKey: 'skyharbor',
      tenantId: 'tenant-skyharbor',
      question: 'Which claims are unsupported or lack evidence?',
      eventType: 'infrastructure',
    });

    expect(answer).not.toBeNull();
    const table = answer!.artifacts.find(
      (artifact) => artifact.artifact === 'table',
    );
    expect(table?.rows.map((row) => row.vendor)).toEqual([
      'Vendor A',
      'Vendor B',
      'Vendor C',
    ]);
    expect(JSON.stringify(answer)).not.toContain('Amadeus');
  });
});
