// PR-2 proof: deliverables differ by use case. A deliverable structure composed with
// an archetype pack yields archetype-specific exhibits/tables/evidence — not one
// generic template — while the AMS RFP keeps its bespoke override.
import { getArtifactBrief, hasDedicatedBrief } from '../artifact-brief-registry';
import { ARCHETYPE_PACKS, getArchetypePack } from '../briefs/archetype-packs';
import { DELIVERABLE_STRUCTURES, getDeliverableStructure } from '../briefs/deliverable-structures';
import { amsRfpRequest } from '../__fixtures__/ams-rfp';
import type { DeliverableIntelligenceRequest } from '../types';

function req(over: Partial<DeliverableIntelligenceRequest>): DeliverableIntelligenceRequest {
  return amsRfpRequest(over);
}

describe('archetype packs', () => {
  it('cover the four named use cases with distinct exhibits', () => {
    for (const a of ['AMS_IT_OUTSOURCING', 'ERP_SI_SELECTION', 'CLOUD_MODERNIZATION', 'AI_PDLC']) {
      const pack = getArchetypePack(a)!;
      expect(pack.exhibits.length).toBeGreaterThanOrEqual(4);
      expect(pack.tables.length).toBeGreaterThanOrEqual(4);
      expect(pack.keyEvidenceFamilies.length).toBeGreaterThan(0);
    }
    expect(Object.keys(ARCHETYPE_PACKS)).toHaveLength(4);
  });

  it('AMS exhibits differ from cloud-modernization exhibits', () => {
    const ams = new Set(getArchetypePack('AMS_IT_OUTSOURCING')!.exhibits.map((e) => e.title));
    const cloud = new Set(getArchetypePack('CLOUD_MODERNIZATION')!.exhibits.map((e) => e.title));
    expect([...cloud].some((t) => !ams.has(t))).toBe(true);
    expect(getArchetypePack('CLOUD_MODERNIZATION')!.tables.some((t) => /6Rs|Disposition/.test(t.title))).toBe(true);
    expect(getArchetypePack('AI_PDLC')!.tables.some((t) => /DORA/.test(t.title))).toBe(true);
  });
});

describe('deliverable structures', () => {
  it('cover Moves + Source artifact types with required sections', () => {
    expect(getDeliverableStructure('moves', 'charter')).toBeTruthy();
    expect(getDeliverableStructure('moves', 'business_case')).toBeTruthy();
    expect(getDeliverableStructure('moves', 'roadmap')).toBeTruthy();
    expect(getDeliverableStructure('source', 'sourcing_strategy_memo')).toBeTruthy();
    for (const d of DELIVERABLE_STRUCTURES) {
      expect(d.requiredSectionKeys.length).toBeGreaterThan(0);
      // Every structure must ground in governed evidence somewhere — but a
      // commitment doc like the P1 Charter grounds through `mixed` sections
      // (evidence + synthesis) rather than a pure `governed_facts` current-state
      // analysis, which belongs to P2. Both modes are evidence-bearing.
      expect(
        d.sections.some(
          (s) => s.groundingMode === 'governed_facts' || s.groundingMode === 'mixed',
        ),
      ).toBe(true);
    }
  });
});

describe('composition — same deliverable type differs by archetype', () => {
  it('a Moves business case for AMS vs cloud carries different exhibits/evidence', () => {
    const amsBC = getArtifactBrief(req({ module: 'moves', deliverableType: 'business_case', useCaseArchetype: 'AMS_IT_OUTSOURCING' }));
    const cloudBC = getArtifactBrief(req({ module: 'moves', deliverableType: 'business_case', useCaseArchetype: 'CLOUD_MODERNIZATION' }));
    // same baseline section flow…
    expect(amsBC.recommendedStructure.map((s) => s.key)).toEqual(cloudBC.recommendedStructure.map((s) => s.key));
    // …but archetype-specific exhibits
    const amsExhibits = amsBC.expectedExhibits.map((e) => e.title);
    const cloudExhibits = cloudBC.expectedExhibits.map((e) => e.title);
    expect(amsExhibits).not.toEqual(cloudExhibits);
    expect(cloudExhibits.join(' ')).toMatch(/Migration Waves|Dependency/);
    // current-state section is enriched with the archetype's evidence families
    const cloudCurrent = cloudBC.recommendedStructure.find((s) => s.key === 'current_state')!;
    expect(cloudCurrent.expectedEvidenceFamilies).toContain('app_dependency_map');
  });

  it('AI-PDLC business case surfaces DORA + AI-tooling intelligence', () => {
    const brief = getArtifactBrief(req({ module: 'moves', deliverableType: 'business_case', useCaseArchetype: 'AI_PDLC' }));
    expect(brief.expectedExhibits.some((e) => /DORA/.test(e.title))).toBe(true);
    expect(brief.expectedTables.some((t) => /AI Tooling/.test(t.title))).toBe(true);
  });

  it('AMS RFP keeps its bespoke override (not the composed default)', () => {
    expect(hasDedicatedBrief('source', 'AMS_IT_OUTSOURCING', 'rfp_package')).toBe(true);
    const brief = getArtifactBrief(req({ module: 'source', deliverableType: 'rfp_package', useCaseArchetype: 'AMS_IT_OUTSOURCING' }));
    expect(brief.disallowedFabrication).toMatch(/incumbent vendor names|spend/i);
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(10);
  });

  it('composed RFP for ERP/SI carries SI-selection governance + exhibits', () => {
    const brief = getArtifactBrief(req({ module: 'source', deliverableType: 'sourcing_strategy_memo', useCaseArchetype: 'ERP_SI_SELECTION' }));
    expect(brief.expectedExhibits.some((e) => /Rollout Waves|Integration/.test(e.title))).toBe(true);
    expect(brief.expectedTables.some((t) => /Integration Register|Data Migration/.test(t.title))).toBe(true);
  });

  it('still falls back to the module default for an unknown deliverable type', () => {
    const brief = getArtifactBrief(req({ module: 'tower', deliverableType: 'mystery_doc', useCaseArchetype: 'UNKNOWN' }));
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(4);
    expect(brief.requiredSections.length).toBeGreaterThan(0);
  });
});
