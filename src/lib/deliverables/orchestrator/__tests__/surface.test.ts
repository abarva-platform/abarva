// Surface proof: governed-evidence assembly, request building, and the generate
// service wire together correctly — with the vendor-facing exclusion and the quality
// gate honored — all without Azure/Claude/DB (collaborators injected).
import { buildDeliverableRequest } from '../build-request';
import { assembleGovernedEvidence } from '../evidence-assembler';
import { runDeliverableForTenant } from '../generate-service';
import { FIRST_CAPITAL_ARCHITECTURE } from '@/lib/visual-system/__fixtures__/first-capital-architecture';
import type { GovernedEvidenceItem, OrchestrationResult } from '../index';
import type { TenantContextChunk } from '@/lib/azure-search/tenant-context-retriever';

function chunk(over: Partial<TenantContextChunk>): TenantContextChunk {
  return {
    tenantKey: 'skyharbor-air', chunkId: 'c1', text: 'baseline fact', embeddingStatus: 'embedded',
    sourceDoc: 'Run-cost baseline', sourceBasis: 'run_cost_baseline', classification: 'internal', vectorScore: 0.9,
    ...over,
  };
}

describe('assembleGovernedEvidence', () => {
  it('maps tenant context chunks to clean citation-numbered evidence', async () => {
    const fakeQuery = (async () => [
      chunk({ chunkId: 'c1', sourceDoc: 'SLA baseline', sourceBasis: 'sla_baseline', vectorScore: 0.95 }),
      chunk({ chunkId: 'c2', sourceDoc: 'App inventory', sourceBasis: 'application_inventory', vectorScore: 0.6 }),
    ]) as never;
    const out = await assembleGovernedEvidence({ tenantClientKey: 'skyharbor-air', query: 'q' }, { queryTenantContext: fakeQuery });
    expect(out.retrievedCount).toBe(2);
    expect(out.evidence[0].citationNumber).toBe(1);
    expect(out.evidence[0].confidence).toBe('high'); // 0.95
    expect(out.evidence[1].confidence).toBe('medium'); // 0.6
    expect(out.sourceRegister).toHaveLength(2);
    // internal ids stay in provenanceRef (audit-only); never in the body-facing fields
    for (const e of out.evidence) {
      expect(e.label).not.toMatch(/c1|c2/);
      expect(e.statement).not.toMatch(/c1|c2/);
    }
    // the source register the document exposes carries no provenance handle at all
    expect(JSON.stringify(out.sourceRegister)).not.toMatch(/c1|c2/);
  });

  it('excludes confidential evidence for a vendor-facing audience (no incumbent-spend leak)', async () => {
    const fakeQuery = (async (input: { filters?: { sensitivity?: string[] } }) => {
      // simulate the index honoring the sensitivity allowlist the assembler passes
      const allow = input.filters?.sensitivity ?? [];
      const all = [
        chunk({ chunkId: 'pub', sourceBasis: 'sla_baseline', classification: 'internal' }),
        chunk({ chunkId: 'conf', sourceBasis: 'contract_baseline', classification: 'confidential' }),
      ];
      return all.filter((c) => allow.includes(c.classification as string));
    }) as never;
    const vendor = await assembleGovernedEvidence({ tenantClientKey: 'skyharbor-air', query: 'q', audienceIsVendorFacing: true }, { queryTenantContext: fakeQuery });
    expect(vendor.evidence.some((e) => e.evidenceFamily === 'contract_baseline')).toBe(false);
    expect(vendor.evidence.some((e) => e.evidenceFamily === 'sla_baseline')).toBe(true);
  });

  it('adds approved move current-state evidence when tenant context retrieval is empty', async () => {
    const fakeQuery = (async () => []) as never;
    const fakeDb = {
      from(table: string) {
        if (table === 'evidence_ledger') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{
                        id: 'ledger-1',
                        claim_text: 'IT organization baseline ingested: 14 workforce records.',
                        source_ref: { moveId: 'move-1', family: 'it_org_structure', fileRef: '01_it_org_structure.csv' },
                        freshness_at: '2026-06-21T00:00:00Z',
                        confidence: 0.8,
                      }],
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'program_evidence_reviews') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: () => ({ in: async () => ({ data: [] }) }) };
      },
    } as never;

    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: 'skyharbor-air',
        clientId: 'client-1',
        sourceArtifactRef: 'move-1',
        query: 'charter current state',
      },
      { queryTenantContext: fakeQuery, db: fakeDb },
    );

    expect(out.retrievedCount).toBe(1);
    expect(out.evidence[0].statement).toMatch(/IT organization baseline/);
    expect(out.evidence[0].label).toBe('01 It Org Structure.csv');
    expect(out.sourceRegister).toHaveLength(1);
  });
});

describe('buildDeliverableRequest', () => {
  const evidence: GovernedEvidenceItem[] = [
    { citationNumber: 1, label: 'SLA', statement: '99.9%', evidenceFamily: 'sla_baseline', confidence: 'high', disclosureTier: 'vendor_facing', provenanceRef: 'p1' },
  ];
  it('produces a board-grade request with sane defaults and the supplied evidence', () => {
    const req = buildDeliverableRequest(
      { module: 'source', useCaseArchetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package', decisionContext: 'approve issuance', clientDisplayName: 'SkyHarbor Air', initiativeDisplayName: 'AMS 2026' },
      evidence, [{ citationNumber: 1, label: 'SLA', evidenceFamily: 'sla_baseline', confidence: 'high' }],
    );
    expect(req.governedEvidenceBundle).toHaveLength(1);
    expect(req.qualityBar.tone).toBe('board_grade_consulting');
    expect(req.formattingProfile.bodyPointSize).toBe(11);
    expect(req.audience.length).toBeGreaterThan(0); // module default applied
    expect(req.outputFormats).toContain('docx');
  });
});

describe('runDeliverableForTenant', () => {
  const baseInput = {
    module: 'source' as const, useCaseArchetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package',
    decisionContext: 'approve issuance', clientDisplayName: 'SkyHarbor Air', initiativeDisplayName: 'AMS 2026',
    tenantClientKey: 'skyharbor-air', clientId: 'client-uuid', userId: 'u1', sourceArtifactRef: 'evt-1',
  };
  const assemble = (async () => ({
    evidence: [{ citationNumber: 1, label: 'SLA', statement: '99.9%', evidenceFamily: 'sla_baseline', confidence: 'high', disclosureTier: 'vendor_facing', provenanceRef: 'p1' }],
    sourceRegister: [{ citationNumber: 1, label: 'SLA', evidenceFamily: 'sla_baseline', confidence: 'high' }],
    retrievedCount: 1,
  })) as never;
  const loadPolicy = (async () => ({ tenantId: 'skyharbor-air', policy: {} })) as never;

  it('persists and returns the artifact when generation passes the gates', async () => {
    const generate = (async () => ({ ok: true, brief: {} as never, document: { generatedSections: [{}, {}] } as never, quality: { pass: true, warnings: ['minor'] } as never, passTrace: [] } as OrchestrationResult)) as never;
    const persist = (async () => ({ id: 'art-9', blobUrl: '/api/v1/artifacts/art-9' })) as never;
    const out = await runDeliverableForTenant(baseInput, { assemble, loadPolicy, generate, persist });
    expect(out.ok).toBe(true);
    expect(out.artifactId).toBe('art-9');
    expect(out.sectionCount).toBe(2);
    expect(out.retrievedEvidence).toBe(1);
  });

  it('returns blockers (and does NOT persist) when the quality gate refuses', async () => {
    let persisted = false;
    const generate = (async () => ({ ok: false, brief: {} as never, quality: { pass: false, blockers: ['no source register'] } as never, passTrace: [], blockedReason: 'quality gate blocked export' } as OrchestrationResult)) as never;
    const persist = (async () => { persisted = true; return { id: 'x' }; }) as never;
    const out = await runDeliverableForTenant(baseInput, { assemble, loadPolicy, generate, persist });
    expect(out.ok).toBe(false);
    expect(out.blockers).toContain('no source register');
    expect(persisted).toBe(false);
  });

  it('generates the architecture model and hands it to persistence when the flag is on (any tenant)', async () => {
    process.env.ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS = 'skyharbor-air';
    let persistOpts: Record<string, unknown> | undefined;
    const generate = (async () => ({
      ok: true,
      brief: { deliverableType: 'target_architecture', module: 'moves' } as never,
      document: {
        generatedSections: [{ title: 'Current state', bodyMarkdown: 'mainframe-bound today' }],
        clientDisplayName: 'SkyHarbor Air',
        initiativeDisplayName: 'IROPS Agentic Response',
      } as never,
      quality: { pass: true, warnings: [] } as never,
      passTrace: [],
    } as OrchestrationResult)) as never;
    const persist = (async (_r: unknown, opts: unknown) => {
      persistOpts = opts as Record<string, unknown>;
      return { id: 'art-arch' };
    }) as never;
    let calledWith: { engagement?: string } = {};
    const generateArchitecture = (async (req: { engagement: string }) => {
      calledWith = req;
      return { model: FIRST_CAPITAL_ARCHITECTURE };
    }) as never;

    const out = await runDeliverableForTenant(
      { ...baseInput, module: 'moves' as const, deliverableType: 'target_architecture' },
      { assemble, loadPolicy, generate, persist, generateArchitecture },
    );

    expect(out.ok).toBe(true);
    expect(calledWith.engagement).toBe('IROPS Agentic Response');
    expect(persistOpts?.renderViaProfile).toBe(true);
    expect(
      (persistOpts?.structuredModels as { architectureModel?: unknown })?.architectureModel,
    ).toBeDefined();
    delete process.env.ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS;
  });
});
