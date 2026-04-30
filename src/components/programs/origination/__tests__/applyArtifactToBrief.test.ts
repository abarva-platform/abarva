/**
 * applyArtifactToBrief — origination brief reducer.
 *
 * Locks in the OV2-1c filter: pattern-match artifacts must NOT mutate
 * the brief on /programs/new (founder feedback — pattern matching
 * belongs at /programs/<id>, not during brief creation). The parser
 * still accepts pattern-match (used by Nexus on the program-detail
 * surface); the origination panel just ignores them.
 */

import { applyArtifactToBrief } from '../ProgramOriginationWorkspace';
import { EMPTY_BRIEF } from '../ProgramBriefPanel';

describe('applyArtifactToBrief', () => {
  it('drops pattern-match artifacts on the origination surface (OV2-1c)', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF, {
      type: 'pattern-match',
      patternId: 'PAT-PRG-CDP-001',
      name: 'CDP Activation',
      summary: 'Customer data platform programme lifecycle.',
      successRatePct: 72,
      deploymentCount: 18,
    });
    // No fields mutated — including the legacy matchedPatternId mirror.
    expect(out).toBe(EMPTY_BRIEF);
    expect(out.matchedPatternId).toBeNull();
  });

  it('applies brief-field artifacts', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF, {
      type: 'brief-field',
      field: 'sponsor',
      value: 'Sarah Chen',
    });
    expect(out.sponsor).toBe('Sarah Chen');
  });

  it('applies classification by archetype label', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF, {
      type: 'classification',
      archetype: 'CDP_ACTIVATION',
      archetypeLabel: 'CDP Activation',
      confidence: 'high',
    });
    expect(out.classification).toBe('CDP Activation');
  });

  it('appends cross-program-dependency entries and dedupes by formatted line', () => {
    const first = applyArtifactToBrief(EMPTY_BRIEF, {
      type: 'cross-program-dependency',
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      currentPhase: 'P3 Design',
    });
    expect(first.crossProgramDependencies).toEqual([
      'APX-CDP-2026 · Apex Retail CDP Activation (P3 Design)',
    ]);
    // Re-applying the same dependency is a no-op.
    const second = applyArtifactToBrief(first, {
      type: 'cross-program-dependency',
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      currentPhase: 'P3 Design',
    });
    expect(second).toBe(first);
  });

  it('returns the brief unchanged for non-origination artifact types', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF, {
      type: 'gate-evaluation',
      gate: 'Build gate',
      status: 'unmet',
    });
    expect(out).toBe(EMPTY_BRIEF);
  });
});
